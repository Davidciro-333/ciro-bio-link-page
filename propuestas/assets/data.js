// Contenido compartido por los 4 mockups.
// REAL: perfil, enlaces, últimas escuchadas, juegos recientes y repos públicos
// (sacados de profile_design_system.json y de los endpoints locales el 2026-10-04).
// EJEMPLO: "ahora suena", "jugando ahora", top del mes y heatmap, para enseñar
// los estados ricos de cada widget. Están marcados con `sample: true`.

window.CIRO = {
  profile: {
    name: 'David Ciro',
    title: 'Desarrollador de software',
    // Copy sugerida para el rediseño (no existe hoy en el sitio).
    line: 'Aquí guardo lo que escucho, lo que juego y lo que construyo.',
  },

  links: [
    { title: 'Mi Portafolio', url: 'https://www.itsciro.com/cirofolio', kind: 'portfolio' },
    { title: 'Instagram', url: 'https://instagram.com/itsciro.me', kind: 'instagram' },
    { title: 'LinkedIn', url: 'https://www.linkedin.com/in/david-ciro', kind: 'linkedin' },
    { title: 'Facebook', url: 'https://www.facebook.com/itsciro.me', kind: 'facebook' },
  ],

  socials: [
    { name: 'Instagram', url: 'https://instagram.com/itsciro.me' },
    { name: 'GitHub', url: 'https://github.com/davidciro-333' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/david-ciro' },
    { name: 'Facebook', url: 'https://www.facebook.com/itsciro.me' },
  ],

  nowPlaying: {
    sample: true,
    title: 'Iron Man (2012 Remaster)',
    artist: 'Black Sabbath',
    album: 'Paranoid',
    cover: 'https://i.scdn.co/image/ab67616d0000b2739f0a9474c47a841c6f03e990',
    url: 'https://open.spotify.com/track/0vJYFKg9z1IvZiQUyX19cD',
    progressMs: 102000,
    durationMs: 356000,
  },

  recent: [
    { title: 'No More Tears', artist: 'Ozzy Osbourne', cover: 'https://i.scdn.co/image/ab67616d0000b273509342e69eb341df70e5c2e3', url: 'https://open.spotify.com/track/7w6PJe5KBPyvuRYxFkPssC', at: '2026-10-04T18:00:30Z' },
    { title: 'Iron Man (2012 Remaster)', artist: 'Black Sabbath', cover: 'https://i.scdn.co/image/ab67616d0000b2739f0a9474c47a841c6f03e990', url: 'https://open.spotify.com/track/0vJYFKg9z1IvZiQUyX19cD', at: '2026-10-04T17:48:49Z' },
    { title: 'Rock You Like A Hurricane', artist: 'Scorpions', cover: 'https://i.scdn.co/image/ab67616d0000b273926764eed4da16a86b9ce33e', url: 'https://open.spotify.com/track/58XWGx7KNNkKneHdprcprX', at: '2026-10-04T17:40:29Z' },
    { title: "Hard to Say I'm Sorry / Get Away", artist: 'Chicago', cover: 'https://i.scdn.co/image/ab67616d0000b273ef255849780dca4ccb991cbe', url: 'https://open.spotify.com/track/07TnWCHrFkvF61GzJuLVt0', at: '2026-10-04T17:36:20Z' },
    { title: 'Corazón Sin Cara', artist: 'Prince Royce', cover: 'https://i.scdn.co/image/ab67616d0000b273a484690118ec2c7a2e2ae124', url: 'https://open.spotify.com/track/0u4N6w5lBw5xMrzJitRWUo', at: '2026-10-04T17:31:19Z' },
  ],

  // Widget nuevo propuesto (necesita el scope user-top-read). Datos de ejemplo.
  topMonth: {
    sample: true,
    items: [
      { title: 'Black Sabbath', sub: '42 reproducciones', cover: 'https://i.scdn.co/image/ab67616d0000b2739f0a9474c47a841c6f03e990' },
      { title: 'Ozzy Osbourne', sub: '35 reproducciones', cover: 'https://i.scdn.co/image/ab67616d0000b273509342e69eb341df70e5c2e3' },
      { title: 'Scorpions', sub: '28 reproducciones', cover: 'https://i.scdn.co/image/ab67616d0000b273926764eed4da16a86b9ce33e' },
      { title: 'Chicago', sub: '19 reproducciones', cover: 'https://i.scdn.co/image/ab67616d0000b273ef255849780dca4ccb991cbe' },
      { title: 'Prince Royce', sub: '14 reproducciones', cover: 'https://i.scdn.co/image/ab67616d0000b273a484690118ec2c7a2e2ae124' },
    ],
  },

  nowGaming: {
    sample: true,
    title: 'skate.',
    platform: 'PS5',
    cover: 'https://image.api.playstation.com/sgst/prod/00/PPSA10793_00/app/info/39/fi_28742e6398f3ceb1f819bf81b3352f0c54f9a1ab925ca927ba5846eb9ebc1a1a/icon0.png',
    since: '38 min',
  },

  games: [
    { title: 'Fortnite', platform: 'PS5', cover: 'https://image.api.playstation.com/sgst/prod/00/PPSA01922_00/app/info/284/fi_8c7bfa40312267e6ed5f0d9adf208a45a561c9316295bb0d28af16db7ccf0dde/icon0.png', at: '2026-09-27T05:23:46Z' },
    { title: 'skate.', platform: 'PS5', cover: 'https://image.api.playstation.com/sgst/prod/00/PPSA10793_00/app/info/39/fi_28742e6398f3ceb1f819bf81b3352f0c54f9a1ab925ca927ba5846eb9ebc1a1a/icon0.png', at: '2026-09-27T03:51:21Z' },
    { title: 'For Honor', platform: 'PS4', cover: 'https://image.api.playstation.com/vulcan/ap/rnd/202402/2815/934a3852ebc9f2e2aec3421cf7ce5e31ad0aeb3cabcd349c.png', at: '2026-09-27T00:48:49Z' },
    { title: 'Call of Duty: Black Ops II', platform: 'PS5', cover: 'https://image.api.playstation.com/vulcan/ap/rnd/202606/2619/c4ce7fe379aa05dd3f6ecc11e8fa38dfea03d4b4a8bad73a.png', at: '2026-08-16T21:49:04Z' },
    { title: 'EA SPORTS FC 26', platform: 'PS5', cover: 'https://image.api.playstation.com/sgst/prod/00/PPSA27360_00/app/info/59/fi_7f45b8231375fb0d46442df95e355f9ee0dbad9ff6035dadb8c7b984466a241b/icon0.png', at: '2026-08-13T06:06:42Z' },
    { title: 'Minecraft', platform: 'PS5', cover: 'https://image.api.playstation.com/sgst/prod/00/PPSA17221_00/app/info/87/fi_25e44b4458d4a4256628a25ba9cae19477e9c531675a72cad214c9f4a5fc9c87/icon0.png', at: '2026-08-02T02:54:58Z' },
  ],

  repos: [
    { name: 'ciro-bio-link-page', lang: 'Astro', langColor: '#ff5a03', stars: 1, at: '2026-10-04T03:50:31Z', desc: 'Esta página: widgets en vivo de Spotify, GitHub y PlayStation.' },
    { name: 'ciroFolio', lang: 'Astro', langColor: '#ff5a03', stars: 1, at: '2026-09-29T18:52:34Z', desc: 'Portafolio bilingüe con casos de estudio.' },
    { name: 'ciro_finanzas', private: true, at: '2026-09-30T12:00:00Z' },
    { name: 'Galactic-AIMA-Web-Page', lang: 'HTML', langColor: '#e34c26', stars: 0, at: '2025-09-17T05:20:07Z' },
  ],

  github: { publicRepos: 4, followers: 2, sample: true, last30: 171, streak: 9 },
};

// Utilidades compartidas
window.CIRO_UTIL = {
  ago(iso) {
    const s = (Date.parse('2026-10-04T19:00:00Z') - Date.parse(iso)) / 1000;
    if (s < 3540) return `hace ${Math.max(1, Math.round(s / 60))} min`;
    if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
    return `hace ${Math.round(s / 86400)} d`;
  },
  fmt(ms) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  },
  // Heatmap de ejemplo: 26 semanas x 7 días, niveles 0-4, determinista.
  heatmap(weeks = 26) {
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: weeks }, (_, w) =>
      Array.from({ length: 7 }, () => {
        const r = rnd() * (0.55 + w / weeks);
        return r < 0.25 ? 0 : r < 0.5 ? 1 : r < 0.75 ? 2 : r < 0.95 ? 3 : 4;
      })
    );
  },
  icon(name, size = 16) {
    const p = {
      Instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
      Facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
      GitHub: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
      LinkedIn: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
      Spotify: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z',
      PlayStation: 'M9.5 3.5v13.7l2.6.8V6.1c0-.6.3-1 .7-.9.6.1.7.7.7 1.2v4.5c1.6.8 2.9-.1 2.9-2.2 0-2.2-.8-3.2-3-4C12.3 4.3 10.8 3.9 9.5 3.5zM14 17.9l4.2-1.5c.5-.2.6-.4.2-.6-.4-.2-1.1-.2-1.6-.1L14 16.8v-1.4l.2-.1s1.9-.7 4.5-.9c1.3.1 2.9.2 4.1.7 1.4.5.5 1.4-.1 1.7L14 19.6zM2.3 17.6c-1.4-.4-1.6-1.2-1-1.7.6-.4 1.5-.7 1.5-.7l3.9-1.4v1.6l-2.8 1c-.5.2-.6.4-.2.6.4.2 1.1.2 1.6.1l1.4-.5v1.4c-1.4.3-3 .2-4.4-.4z',
    }[name];
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"><path d="${p}"/></svg>`;
  },
};
