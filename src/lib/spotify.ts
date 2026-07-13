export async function getAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: import.meta.env.SPOTIFY_REFRESH_TOKEN,
      client_id: import.meta.env.SPOTIFY_CLIENT_ID,
      client_secret: import.meta.env.SPOTIFY_CLIENT_SECRET,
    }),
  });
  const data = await response.json();
  return data.access_token as string;
}
