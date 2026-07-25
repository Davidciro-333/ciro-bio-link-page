// Regenera el SPOTIFY_REFRESH_TOKEN vía el flujo OAuth Authorization Code.
//
// Uso:
//   1. En el dashboard de Spotify (https://developer.spotify.com/dashboard),
//      abre tu app → Settings → Redirect URIs y AÑADE exactamente:
//         http://127.0.0.1:8888/callback
//      (Guarda los cambios.)
//   2. Ejecuta:  node scripts/spotify-auth.mjs
//   3. Abre la URL que imprime, inicia sesión y autoriza.
//   4. Copia el refresh_token que aparece en la terminal y ponlo en:
//         - .env  (local)          → SPOTIFY_REFRESH_TOKEN=...
//         - Vercel (producción)    → variable de entorno SPOTIFY_REFRESH_TOKEN
//      Luego haz redeploy en Vercel.

import http from 'node:http';
import { readFileSync } from 'node:fs';
import { exec } from 'node:child_process';

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-read-playback-state',
].join(' ');

function envVar(key) {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  const m = env.match(new RegExp('^' + key + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || envVar('SPOTIFY_CLIENT_ID');
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || envVar('SPOTIFY_CLIENT_SECRET');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET en .env');
  process.exit(1);
}

const state = Math.random().toString(36).slice(2);
const authUrl =
  'https://accounts.spotify.com/authorize?' +
  new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
    show_dialog: 'true',
  }).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const err = url.searchParams.get('error');

  if (err || !code) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Error de autorización: ${err ?? 'sin código'}</h1>`);
    console.error('❌ Autorización denegada o sin código:', err);
    server.close();
    return;
  }

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await tokenRes.json();

    if (!data.refresh_token) {
      throw new Error(JSON.stringify(data));
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      '<h1>✅ Listo</h1><p>Ya puedes cerrar esta pestaña y volver a la terminal.</p>'
    );

    console.log('\n✅ ¡Refresh token obtenido!\n');
    console.log('SPOTIFY_REFRESH_TOKEN=' + data.refresh_token + '\n');
    console.log('→ Ponlo en .env (local) y en las variables de entorno de Vercel.');
    console.log('→ Luego redeploy en Vercel.\n');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Error al intercambiar el código</h1>');
    console.error('❌ Error intercambiando el código por tokens:\n', e.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log('\n🎧 Autorización de Spotify\n');
  console.log('Abre esta URL en tu navegador (donde ya estás logueado en Spotify):\n');
  console.log(authUrl + '\n');
  // Intento de apertura automática (Windows).
  exec(`start "" "${authUrl}"`, () => {});
});
