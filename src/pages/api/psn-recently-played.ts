import { getRecentlyPlayedGames } from 'psn-api';
import { getPsnAuthorization } from '../../lib/playstation';
import { getPsnCache } from '../../lib/psn-cache';

export const prerender = false;

/** Consulta PSN directamente. Solo sirve en desarrollo (ver psn-now-playing.ts). */
async function fetchLive() {
  const auth = await getPsnAuthorization();
  const response = await getRecentlyPlayedGames(auth, {
    limit: 6,
    categories: ['ps4_game', 'ps5_native_game'],
  });

  return (response.data?.gameLibraryTitlesRetrieve?.games ?? []).map((g) => ({
    title: g.name,
    platform: g.platform,
    imageUrl: g.image?.url ?? null,
    lastPlayedAt: g.lastPlayedDateTime,
    conceptId: g.conceptId,
  }));
}

export async function GET() {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...(status === 200
          ? { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
          : {}),
      },
    });

  try {
    const cached = await getPsnCache();

    if (cached?.recent?.length) {
      return json(cached.recent);
    }

    if (import.meta.env.DEV) {
      try {
        return json(await fetchLive());
      } catch {
        /* cae al error de abajo */
      }
    }

    return json(
      { error: 'Failed to fetch', reason: cached ? 'cache sin juegos' : 'cache ilegible' },
      500
    );
  } catch (error) {
    return json({ error: 'Failed to fetch', reason: String(error).slice(0, 200) }, 500);
  }
}
