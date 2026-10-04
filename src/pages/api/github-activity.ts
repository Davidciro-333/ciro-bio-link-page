export const prerender = false;

const USERNAME =
  process.env.GITHUB_USERNAME ?? import.meta.env.GITHUB_USERNAME ?? 'Davidciro-333';
// Token opcional: sin él la API pública de GitHub permite ~60 req/h por IP.
// Con un token (sin scopes / solo public_repo basta) sube a ~5000 req/h.
const TOKEN = process.env.GITHUB_TOKEN ?? import.meta.env.GITHUB_TOKEN;

// Tipos de evento que cuentan como "estoy trabajando en esto".
const WORK_EVENTS = new Set([
  'PushEvent',
  'PullRequestEvent',
  'CreateEvent',
]);

interface GitHubEvent {
  type: string;
  created_at: string;
  repo: { name: string }; // "owner/repo"
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
  private: boolean;
}

interface GitHubProfile {
  public_repos: number;
  followers: number;
}

type Card = {
  name: string;
  owner: string;
  isContribution: boolean;
  isPrivate: boolean;
  description: string | null;
  language: string | null;
  stars: number;
  /** `null` en repos privados: el enlace daría 404 a cualquier visitante. */
  url: string | null;
  pushedAt: string;
};

/**
 * De un repo privado solo salen a la página el nombre, el lenguaje y la fecha.
 * La descripción y la URL se descartan aquí, en el servidor, para que no viajen
 * al cliente aunque el componente decida no pintarlas.
 */
function redactIfPrivate(card: Card): Card {
  if (!card.isPrivate) return card;
  return { ...card, description: null, url: null, stars: 0 };
}

async function ghFetch(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  return res;
}

/**
 * Deriva los repos "en los que estás trabajando ahora" a partir de tu actividad
 * pública (push / PRs / creación de repos). Esto incluye repos de organizaciones
 * y contribuciones a repos que no son tuyos, que nunca aparecen filtrando por
 * `type=owner` en /users/{user}/repos.
 */
async function reposFromActivity(
  headers: Record<string, string>,
  limit: number
): Promise<Card[]> {
  const res = await ghFetch(
    `https://api.github.com/users/${USERNAME}/events/public?per_page=100`,
    headers
  );
  if (!res.ok) return [];

  const events: GitHubEvent[] = await res.json();
  if (!Array.isArray(events)) return [];

  // Repos únicos por primera aparición (los eventos vienen ordenados por fecha desc),
  // guardando la fecha de tu actividad más reciente en cada uno.
  const seen = new Map<string, string>(); // fullName -> created_at (tu actividad)
  for (const ev of events) {
    if (!WORK_EVENTS.has(ev.type)) continue;
    const fullName = ev.repo?.name;
    if (!fullName) continue;
    if (!seen.has(fullName)) seen.set(fullName, ev.created_at);
    if (seen.size >= limit) break;
  }

  const cards = await Promise.all(
    [...seen.entries()].map(async ([fullName, activityAt]): Promise<Card | null> => {
      const repoRes = await ghFetch(`https://api.github.com/repos/${fullName}`, headers);
      if (!repoRes.ok) return null;
      const r: GitHubRepo = await repoRes.json();
      const owner = fullName.split('/')[0] ?? '';
      return redactIfPrivate({
        name: r.name,
        owner,
        isContribution: owner.toLowerCase() !== USERNAME.toLowerCase(),
        isPrivate: r.private === true,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
        // Usa la fecha de TU actividad, no el push global del repo.
        pushedAt: activityAt,
      });
    })
  );

  return cards.filter((c): c is Card => c !== null);
}

interface ContribRepo {
  repository: {
    name: string;
    nameWithOwner: string;
    url: string;
    description: string | null;
    isFork: boolean;
    isPrivate: boolean;
    stargazerCount: number;
    primaryLanguage: { name: string } | null;
    owner: { login: string };
  };
  contributions: { totalCount: number; nodes: { occurredAt: string }[] };
}

/**
 * Fuente principal (requiere token): repos a los que has CONTRIBUIDO en el último
 * año, vía la API GraphQL de GitHub. A diferencia de /events (solo ~90 días) o
 * /repos?type=owner (solo repos propios), esto incluye contribuciones a repos de
 * organizaciones aunque tu último commit ahí sea de hace meses. Ordena por la
 * fecha de tu última contribución en cada repo.
 *
 * Los repos privados solo llegan si el token tiene el scope `repo`; con un token
 * sin scopes GitHub responde 200 pero los omite en silencio.
 */
async function reposFromContributions(
  token: string,
  limit: number
): Promise<Card[]> {
  const query = `{
    user(login: "${USERNAME}") {
      contributionsCollection {
        commitContributionsByRepository(maxRepositories: 25) {
          repository {
            name nameWithOwner url description isFork isPrivate stargazerCount
            primaryLanguage { name }
            owner { login }
          }
          contributions(first: 1) { totalCount nodes { occurredAt } }
        }
      }
    }
  }`;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'bio-link',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return [];

  const json = await res.json();
  const list: ContribRepo[] | undefined =
    json?.data?.user?.contributionsCollection?.commitContributionsByRepository;
  if (!Array.isArray(list)) return [];

  return list
    .filter((c) => !c.repository.isFork)
    .map((c): Card => {
      const owner = c.repository.owner.login;
      return redactIfPrivate({
        name: c.repository.name,
        owner,
        isContribution: owner.toLowerCase() !== USERNAME.toLowerCase(),
        isPrivate: c.repository.isPrivate === true,
        description: c.repository.description,
        language: c.repository.primaryLanguage?.name ?? null,
        stars: c.repository.stargazerCount,
        url: c.repository.url,
        // Fecha de TU última contribución (nodos ordenados de más reciente a más antiguo).
        pushedAt: c.contributions.nodes[0]?.occurredAt ?? new Date(0).toISOString(),
      });
    })
    .sort((a, b) => +new Date(b.pushedAt) - +new Date(a.pushedAt))
    .slice(0, limit);
}

/** Semanas de heatmap que se envían al cliente: el año completo, como GitHub. */
const HEATMAP_WEEKS = 53;

type Activity = {
  last30Days: number;
  lastYear: number;
  /** Contribuciones en repos que el visitante no puede ver. Solo el número. */
  restricted: number;
  /** Días consecutivos con al menos una contribución, hasta hoy o ayer. */
  streak: number;
  lastContribution: string | null;
  /** Últimas HEATMAP_WEEKS semanas, 7 conteos por semana (domingo→sábado). */
  weeks: number[][];
};

interface CalendarDay {
  date: string;
  contributionCount: number;
}

/**
 * Pulso de actividad: cuánto has trabajado, no en qué. El calendario de GitHub
 * incluye las contribuciones a repos privados, así que esto refleja el trabajo
 * real aunque los repos donde ocurre no sean públicos — que es justo el caso en
 * el que la lista de proyectos parece congelada sin estarlo.
 */
async function fetchActivity(token: string): Promise<Activity | null> {
  const query = `{
    user(login: "${USERNAME}") {
      contributionsCollection {
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }`;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'bio-link',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return null;

  const json = await res.json();
  const collection = json?.data?.user?.contributionsCollection;
  const calendar = collection?.contributionCalendar;
  const rawWeeks: { contributionDays: CalendarDay[] }[] | undefined = calendar?.weeks;
  if (!Array.isArray(rawWeeks)) return null;

  const days: CalendarDay[] = rawWeeks.flatMap((w) => w.contributionDays ?? []);
  const now = Date.now();
  const DAY = 86_400_000;

  const last30Days = days
    .filter((d) => now - new Date(d.date).getTime() < 30 * DAY)
    .reduce((sum, d) => sum + d.contributionCount, 0);

  // El calendario llega hasta hoy, pero los días futuros de la semana en curso
  // vienen a 0: se recorre hacia atrás desde el último día con actividad.
  const withActivity = days.filter((d) => d.contributionCount > 0);
  const lastContribution = withActivity.at(-1)?.date ?? null;

  let streak = 0;
  if (lastContribution) {
    // Una racha solo sigue viva si la última contribución es de hoy o de ayer.
    const gap = Math.floor((now - new Date(lastContribution).getTime()) / DAY);
    if (gap <= 1) {
      const lastIndex = days.findIndex((d) => d.date === lastContribution);
      for (let i = lastIndex; i >= 0 && days[i]!.contributionCount > 0; i--) streak++;
    }
  }

  return {
    last30Days,
    lastYear: calendar?.totalContributions ?? 0,
    restricted: collection?.restrictedContributionsCount ?? 0,
    streak,
    lastContribution,
    weeks: rawWeeks
      .slice(-HEATMAP_WEEKS)
      .map((w) => (w.contributionDays ?? []).map((d) => d.contributionCount)),
  };
}

/**
 * Fallback: tus repos propios más recientes por push. Se usa si la actividad
 * pública viene vacía (GitHub solo expone ~90 días de eventos).
 *
 * Con token se consulta `/user/repos`, que sí incluye los privados (si el token
 * tiene scope `repo`). Es la **única** vía para un repo privado: GraphQL los
 * anonimiza en `restrictedContributionsCount` mientras el perfil tenga apagado
 * "Include private contributions", y también se los salta un repo cuyos commits
 * no te atribuye GitHub (los generados por bots tipo Lovable o Emergent).
 */
async function reposFromOwned(
  headers: Record<string, string>,
  limit: number
): Promise<Card[]> {
  const url = headers.Authorization
    ? 'https://api.github.com/user/repos?sort=pushed&per_page=30&affiliation=owner'
    : `https://api.github.com/users/${USERNAME}/repos?sort=pushed&per_page=30&type=owner`;
  const res = await ghFetch(url, headers);
  if (!res.ok) return [];
  const reposRaw: GitHubRepo[] = await res.json();
  if (!Array.isArray(reposRaw)) return [];
  return reposRaw
    .filter((r) => !r.fork)
    .slice(0, limit)
    .map((r) =>
      redactIfPrivate({
        name: r.name,
        owner: r.full_name?.split('/')[0] ?? USERNAME,
        isContribution: false,
        isPrivate: r.private === true,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
        pushedAt: r.pushed_at,
      })
    );
}

/**
 * Une contribuciones y repos propios en una sola lista ordenada por fecha.
 *
 * Las dos fuentes son complementarias y ninguna basta sola: GraphQL es la única
 * que ve los repos de organizaciones, y `/user/repos` la única que ve los
 * privados. Un repo que sale en ambas se queda con la fecha más reciente de las
 * dos — `pushed_at` es más exacto que el `occurredAt` de GraphQL, que viene
 * redondeado al día.
 */
function mergeByRecency(...sources: Card[][]): Card[] {
  const byRepo = new Map<string, Card>();

  for (const card of sources.flat()) {
    const key = `${card.owner}/${card.name}`.toLowerCase();
    const existing = byRepo.get(key);
    if (!existing) {
      byRepo.set(key, card);
      continue;
    }
    // Se conserva la entrada con más metadatos (la de GraphQL trae descripción
    // y lenguaje) pero con la fecha más reciente de las dos.
    const newest =
      +new Date(card.pushedAt) > +new Date(existing.pushedAt)
        ? card.pushedAt
        : existing.pushedAt;
    const richer = existing.description ? existing : card;
    byRepo.set(key, { ...richer, pushedAt: newest });
  }

  return [...byRepo.values()].sort(
    (a, b) => +new Date(b.pushedAt) - +new Date(a.pushedAt)
  );
}

type Payload = {
  repos: Card[];
  profile: { publicRepos: number; followers: number } | null;
  activity: Activity | null;
};

/**
 * Arma la respuesta con o sin token. `unauthorized` indica que GitHub rechazó
 * el token (401): pasa cuando caduca o se revoca, y entonces responde 401 a
 * TODO lo que lo lleve — incluso a endpoints públicos —, así que cada fuente
 * vuelve vacía y el widget se queda en "Sin repos públicos".
 */
async function buildPayload(
  token: string | undefined
): Promise<{ payload: Payload; unauthorized: boolean }> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bio-link',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const LIMIT = 5;

  // Las dos fuentes se piden siempre y se mezclan: contribuciones (única que
  // ve los repos de organizaciones) + repos propios (única que ve los
  // privados). Con LIMIT en cada una la mezcla tendría poco material, así que
  // se piden más y se recorta al final.
  const POOL = LIMIT * 3;
  const [primary, owned, profileRes, activityStats] = await Promise.all([
    token
      ? reposFromContributions(token, POOL)
      : reposFromActivity(headers, POOL),
    reposFromOwned(headers, POOL),
    ghFetch(`https://api.github.com/users/${USERNAME}`, headers),
    token ? fetchActivity(token).catch(() => null) : Promise.resolve(null),
  ]);

  if (token && profileRes.status === 401) {
    return { payload: { repos: [], profile: null, activity: null }, unauthorized: true };
  }

  // Si la fuente principal viene vacía (sin token, o GraphQL caído) se recurre
  // a la actividad pública, que al menos cubre los últimos ~90 días.
  const contributed =
    primary.length > 0 ? primary : await reposFromActivity(headers, POOL);

  const repos = mergeByRecency(contributed, owned).slice(0, LIMIT);

  const profileRaw: GitHubProfile | null = profileRes.ok
    ? await profileRes.json()
    : null;
  const profile = profileRaw
    ? { publicRepos: profileRaw.public_repos, followers: profileRaw.followers }
    : null;

  return { payload: { repos, profile, activity: activityStats }, unauthorized: false };
}

// Memoria del proceso, igual que la cache de PSN. La tarjeta refresca cada
// 10 min y sin token cada visita gasta ~18 llamadas de un límite de 60/h por
// IP, compartido con todo lo que corre en esas IPs de Vercel.
let memo: { data: Payload; at: number } | null = null;
const MEMO_MS = 5 * 60_000;

// Último estado con repos, sin caducidad: mejor una lista de hace un rato que
// un widget vacío porque GitHub nos limitó o el token caducó.
let lastGood: Payload | null = null;

export async function GET() {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...(status === 200
          ? { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
          : {}),
      },
    });

  if (memo && Date.now() - memo.at < MEMO_MS) return json(memo.data);

  try {
    let { payload, unauthorized } = await buildPayload(TOKEN);

    if (unauthorized) {
      // Sale en los logs de Vercel: es la única pista de que hay que renovarlo.
      console.error(
        '[github-activity] GITHUB_TOKEN rechazado (401): caducado o revocado. ' +
          'Sirviendo datos públicos sin token; renuévalo en Vercel.'
      );
      ({ payload } = await buildPayload(undefined));
    }

    if (payload.repos.length > 0) {
      memo = { data: payload, at: Date.now() };
      lastGood = payload;
      return json(payload);
    }
    return json(lastGood ?? payload);
  } catch {
    if (lastGood) return json(lastGood);
    return json({ error: 'Failed to fetch' }, 500);
  }
}
