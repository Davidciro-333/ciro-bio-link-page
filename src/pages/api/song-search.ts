import { getAccessToken } from '../../lib/spotify';

export const prerender = false;

/**
 * Busca canciones en Spotify para el widget de recomendaciones.
 * El visitante escribe y elige una pista concreta, de modo que lo que llega a
 * `/api/recommend-song` es siempre un id válido y no texto libre.
 */
export async function GET({ url }: { url: URL }) {
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);

  if (query.length < 2) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(
      'https://api.spotify.com/v1/search?' +
        new URLSearchParams({ q: query, type: 'track', limit: '6' }),
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) throw new Error(`Spotify ${res.status}`);

    const data = await res.json();
    const tracks = (data.tracks?.items ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      artists: (t.artists ?? []).map((a: any) => a.name).join(', '),
      imageUrl: t.album?.images?.at(-1)?.url ?? null,
    }));

    return new Response(JSON.stringify(tracks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
