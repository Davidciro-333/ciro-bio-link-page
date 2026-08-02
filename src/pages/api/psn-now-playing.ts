import { getBasicPresence } from 'psn-api';
import { getPsnAuthorization } from '../../lib/playstation';
import { getPsnCache } from '../../lib/psn-cache';

export const prerender = false;

/**
 * Consulta PSN directamente. Solo se usa en desarrollo: desde Vercel la
 * autenticación de Sony nunca completa y la función se queda colgada.
 */
async function fetchLive() {
  const auth = await getPsnAuthorization();
  const { basicPresence } = await getBasicPresence(auth, 'me');

  const onlineStatus =
    basicPresence.primaryPlatformInfo?.onlineStatus ?? basicPresence.onlineStatus ?? 'offline';
  const game = basicPresence.gameTitleInfoList?.[0] ?? null;

  return {
    isPlaying: Boolean(game),
    isOnline: onlineStatus === 'online',
    platform: basicPresence.primaryPlatformInfo?.platform ?? basicPresence.platform ?? null,
    title: game?.titleName ?? null,
    gamePlatform: game?.launchPlatform ?? game?.format ?? null,
    imageUrl: game?.conceptIconUrl ?? game?.npTitleIconUrl ?? null,
  };
}

export async function GET() {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  const cached = await getPsnCache();
  if (cached?.nowPlaying) {
    return json({ ...cached.nowPlaying, updatedAt: cached.updatedAt });
  }

  if (import.meta.env.DEV) {
    try {
      return json({ ...(await fetchLive()), updatedAt: new Date().toISOString() });
    } catch {
      /* cae al error de abajo */
    }
  }

  return json({ error: 'Failed to fetch' }, 500);
}
