import { getRecentlyPlayedGames } from 'psn-api';
import { getPsnAuthorization } from '../../lib/playstation';

export const prerender = false;

export async function GET() {
  try {
    const auth = await getPsnAuthorization();
    const response = await getRecentlyPlayedGames(auth, {
      limit: 6,
      categories: ['ps4_game', 'ps5_native_game'],
    });

    const games = (response.data?.gameLibraryTitlesRetrieve?.games ?? []).map((g) => ({
      title: g.name,
      platform: g.platform,
      imageUrl: g.image?.url ?? null,
      lastPlayedAt: g.lastPlayedDateTime,
      conceptId: g.conceptId,
    }));

    return new Response(JSON.stringify(games), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 });
  }
}
