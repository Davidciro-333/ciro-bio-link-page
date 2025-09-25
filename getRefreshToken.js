import express from 'express';
import fetch from 'node-fetch';
import 'dotenv/config'; // Para cargar las variables de .env

const port = 8888;
const app = express();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = 'http://127.0.0.1:8888/callback';

app.get('/login', (req, res) => {
  const scope = 'user-read-currently-playing user-top-read';
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
  }).toString();
  res.redirect(authUrl.toString());
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  if (code === null) {
    return res.status(400).send('Failed to get authorization code.');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json();

  if (data.refresh_token) {
    console.log('\n✅ ¡Éxito! Tu Refresh Token es:\n');
    console.log(data.refresh_token);
    console.log('\nCópialo y guárdalo de forma segura en tu archivo .env y en Vercel.');
    res.send('¡Token obtenido! Revisa tu terminal.');
  } else {
    res.send('Error al obtener el refresh token. Revisa la terminal.');
    console.error(data);
  }
});

app.listen(port, () => {
  console.log(`\nServidor temporal iniciado.`);
  console.log(`Paso 1: Abre tu navegador y ve a http://127.0.0.1:${port}/login`);
});