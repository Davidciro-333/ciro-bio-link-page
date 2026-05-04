export const prerender = false;

async function getAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: import.meta.env.SPOTIFY_REFRESH_TOKEN,
      client_id: import.meta.env.SPOTIFY_CLIENT_ID,
      client_secret: import.meta.env.SPOTIFY_CLIENT_SECRET,
    }),
  });
  const data = await response.json();
  return data.access_token as string;
}

export async function GET() {
  try {
    const access_token = await getAccessToken();

    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (response.status === 204 || response.status === 404) {
      return new Response(JSON.stringify({ isPlaying: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        isPlaying: data.is_playing,
        title: data.item?.name ?? null,
        artist: data.item?.artists?.[0]?.name ?? null,
        album: data.item?.album?.name ?? null,
        albumImageUrl: data.item?.album?.images?.[0]?.url ?? null,
        songUrl: data.item?.external_urls?.spotify ?? null,
        progressMs: data.progress_ms ?? 0,
        durationMs: data.item?.duration_ms ?? 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 });
  }
}
