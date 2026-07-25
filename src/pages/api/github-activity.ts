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
}

interface GitHubProfile {
  public_repos: number;
  followers: number;
}

type Card = {
  name: string;
  owner: string;
  isContribution: boolean;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  pushedAt: string;
};

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
      return {
        name: r.name,
        owner,
        isContribution: owner.toLowerCase() !== USERNAME.toLowerCase(),
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
        // Usa la fecha de TU actividad, no el push global del repo.
        pushedAt: activityAt,
      };
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
            name nameWithOwner url description isFork stargazerCount
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
      return {
        name: c.repository.name,
        owner,
        isContribution: owner.toLowerCase() !== USERNAME.toLowerCase(),
        description: c.repository.description,
        language: c.repository.primaryLanguage?.name ?? null,
        stars: c.repository.stargazerCount,
        url: c.repository.url,
        // Fecha de TU última contribución (nodos ordenados de más reciente a más antiguo).
        pushedAt: c.contributions.nodes[0]?.occurredAt ?? new Date(0).toISOString(),
      };
    })
    .sort((a, b) => +new Date(b.pushedAt) - +new Date(a.pushedAt))
    .slice(0, limit);
}

/**
 * Fallback: tus repos propios más recientes por push. Se usa si la actividad
 * pública viene vacía (GitHub solo expone ~90 días de eventos).
 */
async function reposFromOwned(
  headers: Record<string, string>,
  limit: number
): Promise<Card[]> {
  const res = await ghFetch(
    `https://api.github.com/users/${USERNAME}/repos?sort=pushed&per_page=20&type=owner`,
    headers
  );
  if (!res.ok) return [];
  const reposRaw: GitHubRepo[] = await res.json();
  if (!Array.isArray(reposRaw)) return [];
  return reposRaw
    .filter((r) => !r.fork)
    .slice(0, limit)
    .map((r) => ({
      name: r.name,
      owner: USERNAME,
      isContribution: false,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      url: r.html_url,
      pushedAt: r.pushed_at,
    }));
}

export async function GET() {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bio-link',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  try {
    const LIMIT = 5;

    // Fuente principal: contribuciones del último año (incluye repos de org).
    // Requiere token; si no hay o falla, cae a la actividad pública (/events).
    const [primary, profileRes] = await Promise.all([
      TOKEN
        ? reposFromContributions(TOKEN, LIMIT)
        : reposFromActivity(headers, LIMIT),
      ghFetch(`https://api.github.com/users/${USERNAME}`, headers),
    ]);

    const activity =
      primary.length > 0 ? primary : await reposFromActivity(headers, LIMIT);

    // Lo real va primero. Si no llega a LIMIT se rellena con tus repos propios
    // más recientes por push, sin duplicar los ya incluidos.
    const repos = [...activity];
    if (repos.length < LIMIT) {
      const owned = await reposFromOwned(headers, LIMIT);
      const seen = new Set(repos.map((r) => `${r.owner}/${r.name}`.toLowerCase()));
      for (const r of owned) {
        if (repos.length >= LIMIT) break;
        if (seen.has(`${r.owner}/${r.name}`.toLowerCase())) continue;
        repos.push(r);
      }
    }

    const profileRaw: GitHubProfile | null = profileRes.ok
      ? await profileRes.json()
      : null;
    const profile = profileRaw
      ? { publicRepos: profileRaw.public_repos, followers: profileRaw.followers }
      : null;

    return new Response(JSON.stringify({ repos, profile }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 });
  }
}
