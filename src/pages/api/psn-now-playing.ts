import { getPsnCache } from '../../lib/psn-cache';

export const prerender = false;

/**
 * Consulta PSN directamente. Solo se usa en desarrollo: desde Vercel la
 * autenticación de Sony nunca completa y la función se queda colgada.
 *
 * `psn-api` se importa de forma dinámica a propósito: con un import estático
 * queda dentro del bundle de producción y la función serverless carga 1.2 MB
 * de código que nunca va a ejecutar, solo para arrancar.
 */
async function fetchLive() {
  const { getBasicPresence } = await import('psn-api');
  const { getPsnAuthorization } = await import('../../lib/playstation');

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
      headers: {
        'Content-Type': 'application/json',
        // El dato de origen solo cambia cada 15 min: que el CDN sirva a los
        // visitantes en vez de invocar la función (y releer el Gist) cada vez.
        ...(status === 200
          ? { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
          : {}),
      },
    });

  // Todo va dentro del try: cualquier excepción no capturada aquí hace que la
  // función devuelva un 500 con el cuerpo vacío, que no dice nada de por qué.
  try {
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

    return json(
      { error: 'Failed to fetch', reason: cached ? 'sin nowPlaying en la cache' : 'cache ilegible' },
      500
    );
  } catch (error) {
    return json({ error: 'Failed to fetch', reason: String(error).slice(0, 200) }, 500);
  }
}
