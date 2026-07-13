import { getBasicPresence } from 'psn-api';
import { getPsnAuthorization } from '../../lib/playstation';

export const prerender = false;

export async function GET() {
  try {
    const auth = await getPsnAuthorization();
    const { basicPresence } = await getBasicPresence(auth, 'me');

    const onlineStatus =
      basicPresence.primaryPlatformInfo?.onlineStatus ??
      basicPresence.onlineStatus ??
      'offline';
    const platform =
      basicPresence.primaryPlatformInfo?.platform ?? basicPresence.platform ?? null;
    const game = basicPresence.gameTitleInfoList?.[0] ?? null;

    return new Response(
      JSON.stringify({
        isPlaying: Boolean(game),
        isOnline: onlineStatus === 'online',
        platform,
        title: game?.titleName ?? null,
        gamePlatform: game?.launchPlatform ?? game?.format ?? null,
        imageUrl: game?.conceptIconUrl ?? game?.npTitleIconUrl ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 });
  }
}
