import { getAccessToken } from '../../lib/spotify';

export const prerender = false;

export async function GET() {
  try {
    const access_token = await getAccessToken();

    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const data = await response.json();

    const tracks = (data.items ?? []).map((item: any) => ({
      id: item.track?.id ?? null,
      title: item.track?.name ?? null,
      artist: item.track?.artists?.[0]?.name ?? null,
      albumImageUrl: item.track?.album?.images?.[0]?.url ?? null,
      songUrl: item.track?.external_urls?.spotify ?? null,
      playedAt: item.played_at ?? null,
    }));

    return new Response(JSON.stringify(tracks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 });
  }
}
