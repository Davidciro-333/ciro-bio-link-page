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

/**
 * Devuelve el último estado publicado, o `null` si no hay Gist configurado o
 * no se pudo leer. La URL `/raw/` sin hash de revisión siempre sirve la última
 * versión; el parámetro de tiempo evita la cache de CDN de GitHub.
 */
export async function getPsnCache(): Promise<PsnCache | null> {
  if (!GIST_ID) return null;

  const url = `https://gist.githubusercontent.com/${GIST_USER}/${GIST_ID}/raw/psn.json?t=${Date.now()}`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as PsnCache;
  } catch {
    return null;
  }
}
