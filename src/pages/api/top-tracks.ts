import { getAccessToken } from '../../lib/spotify';

export const prerender = false;

/**
 * Las 5 canciones más escuchadas de las últimas ~4 semanas (`short_term`).
 *
 * Necesita el scope `user-top-read` en el refresh token. Sin él Spotify
 * responde 403 y aquí se devuelve `{ available: false }`: la pestaña
 * "Más escuchados del mes" simplemente no se muestra.
 */
export async function GET() {
  try {
    const access_token = await getAccessToken();

    const response = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ available: false, tracks: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const tracks = (data.items ?? []).map((t: any) => ({
      id: t?.id ?? null,
      title: t?.name ?? null,
      artist: t?.artists?.[0]?.name ?? null,
      albumImageUrl: t?.album?.images?.[0]?.url ?? null,
      songUrl: t?.external_urls?.spotify ?? null,
    }));

    return new Response(JSON.stringify({ available: tracks.length > 0, tracks }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // El top del mes apenas cambia en una hora.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch {
    return new Response(JSON.stringify({ available: false, tracks: [] }), { status: 500 });
  }
}
