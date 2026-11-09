import { getAccessToken } from '../../lib/spotify';

export const prerender = false;

/**
 * Tempo y energía de la canción, para que las olas del retrato y del hilo
 * vayan a su ritmo. Spotify cerró `audio-features` a las apps nuevas (403
 * desde nov. 2024), así que salen de ReccoBeats: gratis, sin clave, por ID de
 * Spotify. No tiene todo el catálogo; si no conoce la canción, `null` y las
 * olas fluyen despacio sin marcar pulso.
 */
type Feel = { tempo: number; energy: number } | null;
const feelCache = new Map<string, Feel>();

async function getFeel(trackId: string): Promise<Feel> {
  if (feelCache.has(trackId)) return feelCache.get(trackId)!;
  let feel: Feel = null;
  try {
    const res = await fetch(`https://api.reccobeats.com/v1/audio-features?ids=${trackId}`, {
      // Es un adorno: si tarda, la canción sale igual sin él.
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const f = (await res.json())?.content?.[0];
      if (typeof f?.tempo === 'number' && f.tempo > 0) {
        feel = { tempo: Math.round(f.tempo), energy: Math.min(1, Math.max(0, Number(f.energy) || 0)) };
      }
    } else {
      return null; // error del servicio: no se cachea, se reintenta en el próximo poll
    }
  } catch {
    return null;
  }
  if (feelCache.size > 300) feelCache.delete(feelCache.keys().next().value!);
  feelCache.set(trackId, feel);
  return feel;
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
    const trackId: string | null =
      data.currently_playing_type === 'track' && typeof data.item?.id === 'string' ? data.item.id : null;
    const feel = data.is_playing && trackId ? await getFeel(trackId) : null;

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
        tempo: feel?.tempo ?? null,
        energy: feel?.energy ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 });
  }
}
