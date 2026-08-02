import { getAccessToken } from '../../lib/spotify';

export const prerender = false;

const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID ?? import.meta.env.SPOTIFY_PLAYLIST_ID;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? import.meta.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID ?? import.meta.env.TELEGRAM_CHAT_ID;

/** Los ids de Spotify son base62 de 22 caracteres. */
const TRACK_ID = /^[A-Za-z0-9]{22}$/;

const MAX_PER_WINDOW = 5;
const WINDOW_MS = 60 * 60 * 1000;

// Límite por IP en memoria del proceso. No es infalible (cada instancia
// serverless tiene la suya y se reinician), pero corta el spam casual, que es
// el caso realista en una página personal.
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);

  // Poda para que el mapa no crezca sin límite en un proceso longevo.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return false;
}

/** Últimas 100 pistas de la playlist, para no aceptar duplicados. */
async function playlistHasTrack(token: string, trackId: string): Promise<boolean> {
  const base = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`;
  const head = await fetch(`${base}?fields=total&limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!head.ok) return false;

  const { total } = await head.json();
  const offset = Math.max(0, total - 100);

  const res = await fetch(`${base}?fields=items(track(id))&limit=100&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;

  const data = await res.json();
  return (data.items ?? []).some((i: any) => i.track?.id === trackId);
}

async function notifyTelegram(text: string): Promise<void> {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Sin parse_mode: el texto incluye datos de terceros y no queremos que se
      // interprete como markup.
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, disable_web_page_preview: false }),
    });
  } catch {
    // Una notificación fallida no debe romper la recomendación.
  }
}

export async function POST({ request, clientAddress }: { request: Request; clientAddress: string }) {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  if (!PLAYLIST_ID) {
    return json({ error: 'El recomendador no está configurado.' }, 503);
  }

  if (rateLimited(clientAddress ?? 'unknown')) {
    return json({ error: 'Ya recomendaste varias canciones. ¡Vuelve más tarde!' }, 429);
  }

  let trackId: string;
  let from: string;

  try {
    const body = await request.json();
    trackId = String(body.trackId ?? '');
    from = String(body.from ?? '').trim().slice(0, 40);
  } catch {
    return json({ error: 'Petición inválida.' }, 400);
  }

  if (!TRACK_ID.test(trackId)) {
    return json({ error: 'Canción inválida.' }, 400);
  }

  try {
    const token = await getAccessToken();

    const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!trackRes.ok) {
      return json({ error: 'No encontré esa canción.' }, 400);
    }

    const track = await trackRes.json();
    const name: string = track.name;
    const artists: string = (track.artists ?? []).map((a: any) => a.name).join(', ');

    if (await playlistHasTrack(token, trackId)) {
      return json({ ok: true, duplicate: true, name, artists });
    }

    const addRes = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
      }
    );

    if (!addRes.ok) {
      throw new Error(`Spotify ${addRes.status}: ${(await addRes.text()).slice(0, 200)}`);
    }

    await notifyTelegram(
      `🎵 Nueva recomendación${from ? ` de ${from}` : ''}\n\n` +
        `${name} — ${artists}\n` +
        `https://open.spotify.com/track/${trackId}`
    );

    return json({ ok: true, duplicate: false, name, artists });
  } catch {
    return json({ error: 'No se pudo guardar la recomendación.' }, 500);
  }
}
