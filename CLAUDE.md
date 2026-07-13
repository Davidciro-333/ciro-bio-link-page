# CLAUDE.md

Guía para trabajar en este repositorio. El proyecto es un **bio-link personal** (página de enlaces estilo Linktree) para David Ciro, con widgets en vivo de Spotify, PlayStation y GitHub, y un diseño "Deep Space / glassmorphism".

## Stack

- **Astro 5** (`output: 'static'`) con adapter **Vercel** (`@astrojs/vercel`).
- **Tailwind CSS v4** vía el plugin de Vite `@tailwindcss/vite` (no hay `tailwind.config`; se importa con `@import "tailwindcss"` en `src/styles/global.css`).
- **TypeScript** en modo `strict` (extiende `astro/tsconfigs/strict`).
- `bootstrap-icons` como dependencia (iconos).
- `psn-api` para la integración de PlayStation (API no oficial de PSN).
- El idioma del sitio y de la UI es **español** (`<html lang="es">`).

## Comandos

Todos desde la raíz:

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local (`localhost:4321`) |
| `npm run build` | Build de producción a `./dist/` |
| `npm run preview` | Previsualiza el build local |
| `npm run astro ...` | CLI de Astro (`astro add`, `astro check`, etc.) |

## Estructura

```
profile_design_system.json   ← FUENTE DE VERDAD del contenido (perfil, enlaces, colores base)
astro.config.mjs             ← static + adapter Vercel + Tailwind
src/
├── lib/
│   ├── spotify.ts             ← getAccessToken() compartido (refresh-token flow de Spotify)
│   └── playstation.ts         ← getPsnAuthorization() con cache de token en memoria
├── pages/
│   ├── index.astro           ← página principal, compone todos los widgets
│   ├── privacidad.astro      ← política de privacidad
│   └── api/                    ← endpoints SSR (prerender=false), corren como funciones en Vercel
│       ├── now-playing.ts       ← canción actual de Spotify
│       ├── recently-played.ts   ← últimas 5 canciones de Spotify
│       ├── psn-now-playing.ts   ← juego actual + presencia (PlayStation)
│       ├── psn-recently-played.ts ← últimos juegos jugados (PlayStation)
│       └── github-activity.ts   ← repos recientes + perfil (GitHub)
├── layouts/
│   └── Layout.astro          ← <html>, fuentes, orbes de fondo, estrellas, cursor glow, init de tema
├── components/
│   ├── LinkButton.astro
│   ├── SocialIcons.astro
│   ├── SpotifyCard.astro      ← "Ahora escuchando" con barra de progreso en vivo
│   ├── RecentlyPlayedCard.astro
│   ├── PlayStationCard.astro  ← "Jugando ahora" + estado online/offline
│   ├── PlayStationRecentlyPlayedCard.astro
│   ├── GitHubCard.astro       ← proyectos recientes (repos por push) + repos/seguidores
│   ├── ThemeToggle.astro
│   └── icons/*.astro          ← SVGs inline (instagram, facebook, github, linkedin, whatsapp)
├── styles/
│   └── global.css            ← TODO el CSS, variables por tema/paleta
└── assets/
    └── profile-pic.png       ← optimizada vía astro:assets (<Image />)
public/
    └── itsciroicon.svg       ← favicon
```

## Convenciones importantes

### Contenido = `profile_design_system.json`
El perfil, los enlaces principales (`main_links`) y los iconos sociales (`social_icons_bottom`) se leen desde `profile_design_system.json` en la raíz. **Para cambiar enlaces, nombre o título, edita ese JSON, no los `.astro`.** `index.astro` lo importa y mapea `main_links` a `<LinkButton>`.

### Temas y paletas (CSS variables)
- El tema (`dark`/`light`) y la paleta viven como atributos en `<html>`: `data-theme` y `data-palette`.
- Se inicializan con un script inline en `Layout.astro` (lee `localStorage`, con fallback a `prefers-color-scheme`) **antes** del render para evitar flash.
- `ThemeToggle.astro` alterna el tema y persiste en `localStorage`. Usa la clase temporal `.theme-transitioning` + `void html.offsetHeight` para forzar una transición suave.
- Todo el estilado se hace con **CSS custom properties** (`--bg`, `--surface`, `--text`, `--accent-*`, etc.) definidas por selector `html[data-theme=...][data-palette=...]` en `global.css`. Al añadir estilos, usa estas variables en vez de colores fijos.
- Paletas existentes: **`silver`** (default) y **`obsidian`**. Cada una tiene variante `dark` y `light`.
- El JSON `theme` (colores hex dark/light) es heredado/base; la implementación real de color está en `global.css`.

### Integración con Spotify (endpoints SSR)
- `now-playing.ts` y `recently-played.ts` llevan `export const prerender = false;` (se ejecutan como funciones serverless en Vercel, no se prerenderizan pese a `output: 'static'`).
- Ambos obtienen un access token mediante **refresh token flow** (`getAccessToken()` está duplicado en los dos archivos).
- El cliente (`SpotifyCard.astro`) hace polling: `now-playing` cada **35 s**, y anima la barra de progreso localmente con un `setInterval` de 1 s entre fetches. `RecentlyPlayedCard` se refresca cada ~5 min.
- Los widgets se hidratan por `<script>` que reescribe `innerHTML`; el HTML inicial es un estado de "Cargando...".

### Integración con PlayStation (endpoints SSR + `psn-api`)
- No existe API oficial de Sony; se usa `psn-api` (API interna de PSN) autenticando con un **token NPSSO**.
- `src/lib/playstation.ts` intercambia el NPSSO por tokens y **cachea el access token en memoria** (dura ~1h); reautentica solo cuando expira.
- `psn-now-playing.ts` usa `getBasicPresence(auth, 'me')` → juego actual, plataforma (PS5/PS4) y online/offline.
- `psn-recently-played.ts` usa `getRecentlyPlayedGames(auth, {limit:6, categories:['ps4_game','ps5_native_game']})`.
- `PlayStationCard.astro` hace polling cada **60 s**; `PlayStationRecentlyPlayedCard.astro` cada ~5 min.
- ⚠️ **El NPSSO caduca cada ~2 meses** → hay que renovarlo manualmente (ver abajo). Si falta o expiró, los endpoints devuelven error 500 controlado y los widgets muestran un fallback ("No se pudo cargar PlayStation").

### Integración con GitHub (endpoint SSR)
- `github-activity.ts` llama a la API REST pública de GitHub: `GET /users/{user}/repos?sort=pushed` + `GET /users/{user}`.
- Devuelve los 5 repos propios más recientes por push (nombre, lenguaje, estrellas, fecha) + `{publicRepos, followers}`.
- **Decisión de diseño:** se muestran *repos recientes*, NO un feed de commits. La cuenta tiene muy poca actividad pública en `/events` (a menudo sin el array `commits`), así que un feed de commits se vería vacío; los repos por push siempre están poblados.
- `GITHUB_TOKEN` es **opcional**: sin él, la API pública permite ~60 req/h por IP; con token (sin scopes) sube a ~5000 req/h. `GitHubCard.astro` refresca cada 10 min.

### Variables de entorno (`.env`, git-ignorado)
Se acceden con `import.meta.env.*`. En producción deben configurarse en Vercel.

| Variable | Requerida | Para |
| :--- | :--- | :--- |
| `SPOTIFY_CLIENT_ID` | Sí | Spotify |
| `SPOTIFY_CLIENT_SECRET` | Sí | Spotify |
| `SPOTIFY_REFRESH_TOKEN` | Sí | Spotify |
| `PSN_NPSSO` | Sí (PS) | PlayStation — token de 64 caracteres, **caduca ~2 meses** |
| `GITHUB_USERNAME` | No | GitHub (default: `Davidciro-333`) |
| `GITHUB_TOKEN` | No | GitHub (sube el rate limit) |

**Cómo renovar el `PSN_NPSSO` (cada ~2 meses):**
1. Inicia sesión en https://www.playstation.com en el navegador.
2. En la misma sesión, abre https://ca.account.sony.com/api/v1/ssocookie
3. Copia el valor de `npsso` (64 caracteres).
4. Actualiza `PSN_NPSSO` en `.env` (local) y en las variables de entorno de Vercel (producción); redeploy.

### Efectos visuales
`Layout.astro` genera 55 "estrellas" por JS y aplica un efecto de "cursor glow" local (variables `--mouse-x`/`--mouse-y` por elemento) sobre `.link-btn`, `.widget` y `.social-icon`. Los orbes de fondo (`.orb-1/2/3`) son divs con blur.

## Notas

- El `README.md` es el genérico de Astro y **no** describe este proyecto; usa este CLAUDE.md.
- Hay archivos sueltos en la raíz (`proposal-1-deep-space-v2.html`, `tweaks-panel.jsx`) que son bocetos/experimentos de diseño, no forman parte del build de Astro.
- Deploy: Vercel (build estático + funciones para los endpoints `/api/*`).

## Roadmap

- **Fase 2 — Chat IA ("clon"):** mini-chat con Claude que responde preguntas sobre David (portafolio, experiencia). Requisitos acordados: **límite de mensajes** por usuario/sesión y **no exponer información privada** (solo datos públicos del perfil). Implica un endpoint serverless nuevo + rate limiting; tiene costo por uso. Aún no implementado.
- Posibles integraciones futuras evaluadas: WakaTime (horas de código), Steam (gaming en PC), Discord/Lanyard (presencia en tiempo real), tarjeta de trofeos de PlayStation.
