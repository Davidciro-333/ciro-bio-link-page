# itsciro.com — Bio-link personal

Página de enlaces personal (estilo Linktree) de **David Ciro**, con diseño _"Deep Space / glassmorphism"_ y **widgets en vivo** de Spotify, GitHub y PlayStation.

🔗 **En vivo:** [itsciro.com](https://itsciro.com)

## ✨ Características

- **Enlaces y perfil** definidos desde un único JSON (`profile_design_system.json`), no en el markup.
- **Temas y paletas** (`dark` / `light`, `silver` / `obsidian`) con transición suave, persistidos en `localStorage` y sin flash inicial.
- **Spotify** — "Ahora escuchando" con barra de progreso en vivo, y "Últimas escuchadas" con un **mini-player integrado**: pulsa una pista y suena en la propia página (muestra de ~30 s, o canción completa si tienes sesión de Spotify Premium abierta).
- **GitHub** — proyectos ordenados por tus **contribuciones** del último año (vía GraphQL), incluyendo repos de organizaciones, no solo repos propios.
- **PlayStation** — juego actual y últimas partidas (solo activo en desarrollo, ver nota abajo).
- Detalles visuales: orbes de fondo con blur, campo de estrellas generado por JS y efecto de _cursor glow_ sobre botones y widgets.

## 🛠️ Stack

- [**Astro 5**](https://astro.build) (`output: 'static'`) con adapter [`@astrojs/vercel`](https://docs.astro.build/en/guides/integrations-guide/vercel/).
- [**Tailwind CSS v4**](https://tailwindcss.com) vía el plugin de Vite `@tailwindcss/vite` (sin `tailwind.config`).
- **TypeScript** en modo `strict`.
- [`psn-api`](https://github.com/achievements-app/psn-api) para la integración con PlayStation.
- Los endpoints de widgets corren como **funciones serverless** en Vercel (`prerender = false`) pese al build estático.

## 📁 Estructura

```
profile_design_system.json   ← fuente de verdad del contenido (perfil, enlaces, colores)
src/
├── lib/                      ← auth de Spotify y PlayStation
├── pages/
│   ├── index.astro           ← página principal
│   └── api/                  ← endpoints SSR (Spotify / PlayStation / GitHub)
├── layouts/                  ← <html>, fondo, estrellas, init de tema
├── components/               ← LinkButton, tarjetas de widgets, ThemeToggle, iconos
└── styles/global.css         ← todo el CSS, variables por tema/paleta
scripts/
└── spotify-auth.mjs          ← regenera el refresh token de Spotify (OAuth)
```

## 🧞 Comandos

Todos desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local en `localhost:4321` |
| `npm run build` | Build de producción a `./dist/` |
| `npm run preview` | Previsualiza el build local |

## 🔐 Variables de entorno

Se definen en un `.env` (git-ignorado) para local y en Vercel para producción.

| Variable | Requerida | Para |
| :--- | :--- | :--- |
| `SPOTIFY_CLIENT_ID` | Sí | Spotify |
| `SPOTIFY_CLIENT_SECRET` | Sí | Spotify |
| `SPOTIFY_REFRESH_TOKEN` | Sí | Spotify (regenerable con `scripts/spotify-auth.mjs`) |
| `GITHUB_TOKEN` | Sí (GitHub) | Necesario para la fuente de contribuciones (GraphQL); también sube el rate limit |
| `GITHUB_USERNAME` | No | GitHub (default: `Davidciro-333`) |
| `PSN_NPSSO` | Sí (PS) | PlayStation — token de 64 caracteres, caduca ~cada 2 meses |

## 📝 Notas sobre las integraciones

- **Spotify:** la reproducción usa la _iframe Embed API_ oficial. Los visitantes anónimos escuchan una muestra de ~30 s; la canción completa requiere una sesión de Spotify Premium abierta en el navegador (limitación de licencias de Spotify).
- **GitHub:** la fuente principal es la API GraphQL `contributionsCollection` (último año), con fallback en cascada a la actividad pública y a los repos propios.
- **PlayStation:** Sony descarta las peticiones de autenticación desde IPs de datacenter (donde corre Vercel), por lo que los widgets de PS solo se renderizan en **desarrollo**. Los endpoints quedan en el repo a la espera de una solución con un fetcher externo.

## 🚀 Deploy

Desplegado en **Vercel**: build estático + funciones serverless para los endpoints `/api/*`. Cada push a `master` dispara un nuevo deploy.
