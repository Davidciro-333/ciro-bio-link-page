// Obtiene el estado de PlayStation (juego actual + jugados recientemente) y lo
// publica en un Gist de GitHub, que el sitio lee como cache.
//
// Por qué existe: Sony bloquea la autenticación de PSN desde IPs de datacenter,
// así que las funciones serverless de Vercel nunca completan el login. Este script
// corre fuera de Vercel (GitHub Actions o, si Sony también lo bloquea, la máquina
// local de David) y deja los datos ya resueltos en un Gist público.
//
// Uso:
//   node scripts/psn-fetch.mjs --dry    → solo imprime lo que obtuvo
//   node scripts/psn-fetch.mjs          → además actualiza el Gist
//
// Variables necesarias (env o .env en local):
//   PSN_NPSSO       token de 64 caracteres (caduca ~cada 2 meses)
//   PSN_GIST_ID     id del Gist destino (no hace falta con --dry)
//   PSN_GIST_TOKEN  token de GitHub con scope `gist` (o GITHUB_TOKEN en local)

import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getBasicPresence,
  getRecentlyPlayedGames,
} from 'psn-api';
import { readFileSync } from 'node:fs';

export const GIST_FILENAME = 'psn.json';

const DRY = process.argv.includes('--dry');

function env(key) {
  if (process.env[key]) return process.env[key].trim();
  try {
    const file = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    return file.match(new RegExp('^' + key + '=(.*)$', 'm'))?.[1].trim() ?? '';
  } catch {
    return '';
  }
}

async function fetchPsnState() {
  const npsso = env('PSN_NPSSO');
  if (!npsso) throw new Error('PSN_NPSSO no está configurado');

  const accessCode = await exchangeNpssoForAccessCode(npsso);
  const auth = await exchangeAccessCodeForAuthTokens(accessCode);

  const [{ basicPresence }, recent] = await Promise.all([
    getBasicPresence(auth, 'me'),
    getRecentlyPlayedGames(auth, {
      limit: 6,
      categories: ['ps4_game', 'ps5_native_game'],
    }),
  ]);

  const onlineStatus =
    basicPresence.primaryPlatformInfo?.onlineStatus ?? basicPresence.onlineStatus ?? 'offline';
  const game = basicPresence.gameTitleInfoList?.[0] ?? null;

  return {
    updatedAt: new Date().toISOString(),
    nowPlaying: {
      isPlaying: Boolean(game),
      isOnline: onlineStatus === 'online',
      platform: basicPresence.primaryPlatformInfo?.platform ?? basicPresence.platform ?? null,
      title: game?.titleName ?? null,
      gamePlatform: game?.launchPlatform ?? game?.format ?? null,
      imageUrl: game?.conceptIconUrl ?? game?.npTitleIconUrl ?? null,
    },
    recent: (recent.data?.gameLibraryTitlesRetrieve?.games ?? []).map((g) => ({
      title: g.name,
      platform: g.platform,
      imageUrl: g.image?.url ?? null,
      lastPlayedAt: g.lastPlayedDateTime,
      conceptId: g.conceptId,
    })),
  };
}

async function publishToGist(state) {
  const gistId = env('PSN_GIST_ID');
  const token = env('PSN_GIST_TOKEN') || env('GITHUB_TOKEN');
  if (!gistId) throw new Error('PSN_GIST_ID no está configurado');
  if (!token) throw new Error('PSN_GIST_TOKEN / GITHUB_TOKEN no está configurado');

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gist ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

const startedAt = Date.now();
try {
  const state = await fetchPsnState();
  console.log(`PSN OK en ${Date.now() - startedAt} ms`);
  console.log(JSON.stringify(state, null, 2));

  if (DRY) {
    // nada que publicar
  } else if (!env('PSN_GIST_ID')) {
    console.warn('⚠️  Sin PSN_GIST_ID: se obtuvieron los datos pero no se publicaron.');
  } else {
    await publishToGist(state);
    console.log('Gist actualizado.');
  }
} catch (error) {
  console.error(`FALLO tras ${Date.now() - startedAt} ms:`, error?.message ?? error);
  process.exit(1);
}
