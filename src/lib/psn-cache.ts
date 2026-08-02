// Lectura de la cache de PlayStation publicada en un Gist.
//
// Sony bloquea la autenticación de PSN desde IPs de datacenter, así que Vercel
// no puede hablar con PSN directamente (ver CLAUDE.md). En su lugar, un job de
// GitHub Actions corre `scripts/psn-fetch.mjs` cada 15 min y deja el estado ya
// resuelto en un Gist público; estos endpoints solo leen de ahí.

export interface PsnNowPlaying {
  isPlaying: boolean;
  isOnline: boolean;
  platform: string | null;
  title: string | null;
  gamePlatform: string | null;
  imageUrl: string | null;
}

export interface PsnRecentGame {
  title: string;
  platform: string;
  imageUrl: string | null;
  lastPlayedAt: string;
  conceptId: string;
}

export interface PsnCache {
  updatedAt: string | null;
  nowPlaying: PsnNowPlaying | null;
  recent: PsnRecentGame[];
}

const GIST_ID = process.env.PSN_GIST_ID ?? import.meta.env.PSN_GIST_ID;
const GIST_USER =
  process.env.GITHUB_USERNAME ?? import.meta.env.GITHUB_USERNAME ?? 'Davidciro-333';

// Memoria del proceso. El Gist solo cambia cada 15 min, así que releerlo en
// cada visita no aporta nada y sí gasta cuota: GitHub limita `raw` por IP y las
// de Vercel son compartidas entre miles de proyectos, así que a base de
// peticiones empieza a devolver 403/429 de forma intermitente.
let memo: { data: PsnCache; at: number } | null = null;
const MEMO_MS = 60_000;

// Último estado bueno, sin caducidad: si GitHub nos corta un rato, es mejor
// mostrar datos de hace 20 minutos que un widget roto.
let lastGood: PsnCache | null = null;

/**
 * Devuelve el último estado publicado, o `null` si no hay Gist configurado y
 * nunca se pudo leer. La URL `/raw/` sin hash de revisión sirve siempre la
 * última versión; no se le añade cache-busting a propósito, para aprovechar la
 * CDN de GitHub en vez de golpear el origen en cada petición.
 */
export async function getPsnCache(): Promise<PsnCache | null> {
  if (!GIST_ID) return null;

  if (memo && Date.now() - memo.at < MEMO_MS) {
    return memo.data;
  }

  const url = `https://gist.githubusercontent.com/${GIST_USER}/${GIST_ID}/raw/psn.json`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return lastGood;

    const data = (await res.json()) as PsnCache;
    memo = { data, at: Date.now() };
    lastGood = data;
    return data;
  } catch {
    return lastGood;
  }
}
