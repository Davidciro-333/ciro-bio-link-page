# CLAUDE.md

Guía para trabajar en este repositorio. El proyecto es un **bio-link personal** (página de enlaces estilo Linktree) para David Ciro, con widgets en vivo de Spotify, PlayStation y GitHub, y un diseño **"Farol"** (un diario a la luz de un farol, en la oscuridad). El contrato visual vive en [`DESIGN.md`](DESIGN.md): **léelo antes de tocar cualquier estilo**.

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
DESIGN.md                    ← CONTRATO VISUAL (tokens, tipografía, componentes, movimiento, prohibiciones)
profile_design_system.json   ← FUENTE DE VERDAD del contenido (perfil, handle, frase, enlaces)
astro.config.mjs             ← static + adapter Vercel + Tailwind
src/
├── lib/
│   ├── spotify.ts             ← getAccessToken() compartido (refresh-token flow de Spotify)
│   ├── client.ts              ← utilidades de navegador para los widgets (escapeHtml, timeAgo, setEntryMeta, iconos)
│   ├── playstation.ts         ← getPsnAuthorization() con cache de token en memoria (solo dev)
│   └── psn-cache.ts           ← lee el Gist donde el job de Actions publica el estado de PSN
├── pages/
│   ├── index.astro           ← página principal, compone todos los widgets
│   ├── privacidad.astro      ← política de privacidad
│   └── api/                    ← endpoints SSR (prerender=false), corren como funciones en Vercel
│       ├── now-playing.ts       ← canción actual de Spotify
│       ├── recently-played.ts   ← últimas 5 canciones de Spotify
│       ├── top-tracks.ts        ← 5 canciones más escuchadas del mes (necesita scope user-top-read)
│       ├── song-search.ts       ← búsqueda de canciones (recomendador)
│       ├── recommend-song.ts    ← añade la canción recomendada a la playlist + avisa por Telegram
│       ├── psn-now-playing.ts   ← juego actual + presencia (PlayStation)
│       ├── psn-recently-played.ts ← últimos juegos jugados (PlayStation)
│       └── github-activity.ts   ← repos recientes + perfil (GitHub)
├── layouts/
│   └── Layout.astro          ← <html>, fuentes, canvas de polvo y niebla de fondo
├── components/
│   ├── Journal.astro          ← "Mi diario": tablist Música / Juegos / Código con un slot por entrada
│   ├── LinkButton.astro
│   ├── SocialIcons.astro
│   ├── SpotifyCard.astro      ← "Ahora escuchando" con barra de progreso en vivo
│   ├── RecentlyPlayedCard.astro
│   ├── PlayStationCard.astro  ← "Jugando ahora" + estado online/offline
│   ├── PlayStationRecentlyPlayedCard.astro
│   ├── GitHubCard.astro       ← proyectos recientes (repos por push) + repos/seguidores
│   ├── RecommendSongCard.astro ← buscador para que un visitante recomiende una canción
│   └── icons/*.astro          ← SVGs inline (instagram, facebook, github, linkedin, whatsapp)
├── styles/
│   └── global.css            ← TODO el CSS: tokens de DESIGN.md + componentes
└── assets/
    └── profile-pic.png       ← optimizada vía astro:assets (<Image />)
public/
    └── itsciroicon.svg       ← favicon
scripts/
├── spotify-auth.mjs         ← regenera el SPOTIFY_REFRESH_TOKEN (flujo OAuth local)
└── psn-fetch.mjs            ← obtiene el estado de PSN y lo publica en el Gist de cache
.github/workflows/
└── psn-cache.yml            ← cron cada 15 min que corre psn-fetch.mjs fuera de Vercel
docs/design/                 ← design-contract.md (decisiones) + implementation-handoff.md
propuestas/                  ← mockups HTML de las 4 direcciones + Farol v2 (no entran en el build)
```

## Convenciones importantes

### Contenido = `profile_design_system.json`
El perfil, los enlaces principales (`main_links`) y los iconos sociales (`social_icons_bottom`) se leen desde `profile_design_system.json` en la raíz. **Para cambiar enlaces, nombre o título, edita ese JSON, no los `.astro`.** `index.astro` lo importa y mapea `main_links` a `<LinkButton>`.

### Diseño "Farol" (CSS variables)
- **Solo tema oscuro.** No hay toggle, ni `data-theme`, ni paletas alternativas (se eliminaron el 2026-10-04).
- Todo el color sale de los tokens de `:root` en `global.css` (`--bg`, `--surface`, `--ink-line`, `--text`, `--muted`, `--lamp`, `--glow`). **Un solo acento: `--lamp` (ámbar).** No añadir colores fijos ni otros acentos; el verde de Spotify y el azul de PlayStation no se usan en la interfaz.
- Tipografía: Cormorant Garamond (nombre, títulos, enlaces) + Alegreya Sans (texto). Mínimo 13px.
- Los widgets viven dentro de `Journal.astro` ("Mi diario"): una entrada abierta a la vez, con navegación por teclado (flechas, Inicio, Fin). Cada widget actualiza el texto de su entrada con `setEntryMeta()` ("sonando ahora", "desconectado", "171 este mes").
- Cada widget tiene estado de carga (esqueletos `.sk` que respiran), vacío y error. Nunca el texto "Cargando...".
- Todo lo animado se apaga con `prefers-reduced-motion`.

### Integración con Spotify (endpoints SSR)
- `now-playing.ts` y `recently-played.ts` llevan `export const prerender = false;` (se ejecutan como funciones serverless en Vercel, no se prerenderizan pese a `output: 'static'`).
- Ambos obtienen un access token mediante **refresh token flow** (`getAccessToken()` está duplicado en los dos archivos).
- El cliente (`SpotifyCard.astro`) hace polling: `now-playing` cada **35 s**, y anima la barra de progreso localmente con un `setInterval` de 1 s entre fetches. `RecentlyPlayedCard` se refresca cada ~5 min.
- Los widgets se hidratan por `<script>` que reescribe `innerHTML` (siempre pasando el texto por `escapeHtml()`); el HTML inicial es un esqueleto de carga.
- `RecentlyPlayedCard` tiene dos vistas: *Últimas* y *Más escuchados del mes*. La segunda sale de `/api/top-tracks`, que necesita el scope **`user-top-read`**: si el token no lo tiene, el endpoint responde `{ available: false }` y la pestaña no se muestra.

### Integración con PlayStation (endpoints SSR + `psn-api`)
- No existe API oficial de Sony; se usa `psn-api` (API interna de PSN) autenticando con un **token NPSSO**.
- `src/lib/playstation.ts` intercambia el NPSSO por tokens y **cachea el access token en memoria** (dura ~1h); reautentica solo cuando expira.
- 🚫 **Vercel no puede hablar con PSN.** Sony bloquea/descarta las peticiones de auth desde las IPs de Vercel (AWS `iad1`): la llamada se cuelga y la función muere con 500. **No es problema del token ni del código.**
- ✅ Los **runners de GitHub Actions sí pasan** (verificado 2026-08-02: auth completa en ~1.2 s). O sea, el bloqueo de Sony no cubre todo datacenter; es específico de los rangos de Vercel/AWS.
- **Por eso los datos vienen de una cache, no de PSN en vivo:**
  1. `.github/workflows/psn-cache.yml` corre `scripts/psn-fetch.mjs` **cada 15 min** en un runner de GitHub.
  2. El script autentica con el NPSSO, obtiene presencia + juegos recientes y hace `PATCH` a un **Gist público** (`psn.json`).
  3. `src/lib/psn-cache.ts` lee ese Gist por su URL `/raw/` y los endpoints `psn-*.ts` sirven lo que haya ahí.
- **Fallback en desarrollo:** si la cache está vacía o no hay `PSN_GIST_ID`, los endpoints consultan PSN directamente, pero **solo bajo `import.meta.env.DEV`** — hacerlo en Vercel colgaría la función hasta el timeout.
- ⚠️ **`psn-api` se importa de forma dinámica (`await import(...)`) dentro de ese fallback, y debe seguir así.** Con un import estático, Rollup lo deja en el bundle de producción aunque el código que lo usa se elimine por `DEV`: la función serverless carga 1.2 MB que nunca ejecuta y **muere en el arranque con un 500 de cuerpo vacío**. Pasó el 2026-08-02 y costó de diagnosticar justamente porque el 500 no traía cuerpo ni el mensaje de error propio. Si un endpoint de PSN vuelve a dar 500 sin cuerpo, mira primero los imports del bundle en `.vercel/output/functions/_render.func/dist/server/pages/api/`.
- Los endpoints memoizan el Gist **60 s** por proceso, guardan el último estado bueno como fallback y devuelven `s-maxage=60`. No leer el Gist en cada visita es deliberado: GitHub limita `raw` por IP y las de Vercel son compartidas.
- Los widgets se muestran si hay `PSN_GIST_ID` configurado o si estás en local (`showPlayStation` en `index.astro`).
- `PlayStationCard.astro` hace polling cada **60 s**; `PlayStationRecentlyPlayedCard.astro` cada ~5 min. Con la cache detrás, el dato real tiene como mucho ~15 min de retraso.
- ⚠️ **El NPSSO caduca cada ~2 meses** → renovarlo en el secret `PSN_NPSSO` **del repo de GitHub** (ya no hace falta en Vercel). Si expira, el job falla y el Gist se queda con el último estado bueno.
- ⚠️ Los cron de GitHub Actions **se retrasan** en horas pico (a veces 10-20 min) y GitHub **desactiva el schedule** en repos sin actividad durante 60 días.

### Integración con GitHub (endpoint SSR)
- `github-activity.ts` devuelve los 5 proyectos en los que **has trabajado/contribuido** más recientemente (nombre, owner, lenguaje, estrellas, fecha, si es contribución) + `{publicRepos, followers}`.
- **Dos fuentes que se mezclan** (`mergeByRecency()`), porque son complementarias y **ninguna basta sola**:
  1. **Contribuciones (GraphQL, requiere `GITHUB_TOKEN`)** — `contributionsCollection.commitContributionsByRepository` del **último año**. La única que ve **repos de organizaciones** (p. ej. `Galactic-AIMA/*`) aunque tu último commit sea de hace meses. **No ve los privados** (ver abajo).
  2. **Repos propios (`/user/repos?affiliation=owner`)** — la única que ve los **privados**. Ordena por `pushed_at`.
  - Un repo presente en ambas conserva los metadatos más ricos (GraphQL trae descripción) y la **fecha más reciente** de las dos; `pushed_at` es exacto y el `occurredAt` de GraphQL viene redondeado al día.
  - Se piden `LIMIT * 3` de cada una para que la mezcla tenga material, y se recorta a 5 al final.
- **Fallback:** si GraphQL viene vacío (sin token o caído) entra la **actividad pública** (`/users/{user}/events/public`), que solo cubre ~90 días / ~300 eventos.
- ⚠️ **No convertir esto otra vez en una cascada con `reposFromOwned` de relleno.** Fue el bug original: al usarse solo "si faltan repos para llegar a 5", y devolver GraphQL siempre 5, la rama de los privados no se ejecutaba nunca.
- **Decisión de diseño:** se muestran *proyectos recientes / contribuciones*, NO un feed de commits.
- `GITHUB_TOKEN`: **necesario** para la fuente de contribuciones (GraphQL no funciona sin auth). Sin token todo sigue funcionando pero degradado a la actividad pública/repos propios (no muestra contribuciones antiguas como SignalFactoryApp). También sube el rate limit (~60→~5000 req/h). `GitHubCard.astro` refresca cada 10 min. **Debe estar configurado en Vercel.**

#### Repos privados
- El endpoint los incluye, pero **solo si el `GITHUB_TOKEN` tiene el scope `repo`**. Con un PAT sin scopes GitHub responde 200 y los omite en silencio — no hay error que delate el problema. Comprobar con `curl -sI -H "Authorization: Bearer $TOKEN" https://api.github.com/user | grep x-oauth-scopes`.
- 🚫 **GraphQL nunca devuelve los repos privados**, ni con scope `repo` ni consultándote a ti mismo. Los agrega anónimamente en `restrictedContributionsCount` porque el perfil tiene apagado *Settings → Profile → "Include private contributions on my profile"*. **Verificado 2026-08-09** con un token con scope `repo`: REST devolvía `private=true` para `ciro_finanzas`, y la misma consulta por GraphQL seguía listando solo repos públicos con `restricted: 80`. Por eso los privados **tienen que venir de REST** (`/user/repos`).
- De un repo privado solo sale el **nombre, el lenguaje y la fecha**. `redactIfPrivate()` borra descripción, URL y estrellas **en el servidor**, para que no viajen al cliente. La tarjeta los pinta como `<div>` sin enlace (daría 404) con una etiqueta 🔒 "privado".
- `reposFromOwned()` usa `/user/repos?affiliation=owner` cuando hay token (incluye privados) y `/users/{user}/repos` cuando no. Es la única vía para un repo privado cuyos commits **no te atribuye GitHub** — p. ej. los generados por bots tipo Lovable (`lovable-dev[bot]`) o Emergent (`emergent-agent-e1`), que no cuentan como contribución tuya y por tanto nunca salen por GraphQL.

#### Franja de actividad (heatmap)
- Sobre la lista de repos hay un **heatmap del último año + contribuciones de los últimos 30 días + racha** (`fetchActivity()` → `activity` en la respuesta).
- **Por qué existe:** la lista de proyectos se mueve solo cuando hay commits en repos *visibles*. Si el trabajo reciente está en repos privados, el widget parece abandonado sin estarlo (caso real 2026-08-09: último repo listado "hace 6d" mientras había **171 contribuciones en 30 días**, 80 de ellas privadas).
- El `contributionCalendar` de GraphQL **ya incluye las contribuciones privadas** en los totales, sin revelar en qué repo. Por eso el heatmap funciona incluso con un token sin scope `repo`; `restrictedContributionsCount` da aparte cuántas son restringidas.
- La semana en curso llega incompleta del API; `activityStrip()` la rellena con `.gh-hm-pad` para no descuadrar la rejilla.

### Recomendador de canciones (`song-search.ts` + `recommend-song.ts`)
- `RecommendSongCard.astro` deja que un visitante busque una canción y la recomiende; se añade a una **playlist pública** de David y llega un aviso por **Telegram**.
- Flujo: el visitante escribe → `GET /api/song-search?q=` (búsqueda de Spotify, 6 resultados, debounce de 350 ms) → elige una → panel de confirmación con nombre opcional → `POST /api/recommend-song` con `{trackId, from}`.
- **Solo se acepta un `trackId`** (base62 de 22 caracteres), nunca texto libre: lo que se añade a la playlist siempre es una pista que existe.
- El endpoint verifica duplicados contra las **últimas 100** pistas de la playlist antes de añadir.
- **Anti-spam:** límite de **5 recomendaciones por IP por hora**, en un `Map` en memoria del proceso. No es infalible (cada instancia serverless tiene el suyo), pero corta el abuso casual; si algún día hace falta algo serio, mover a Upstash/KV.
- El aviso de Telegram se manda **sin `parse_mode`** (el texto lleva datos de terceros y no debe interpretarse como markup). Si falla, la recomendación igual se guarda.
- Requiere el scope **`playlist-modify-public`** en el refresh token: ya está en `scripts/spotify-auth.mjs`, pero un token generado antes de añadirlo **no lo tiene** → hay que regenerarlo.
- Si falta `SPOTIFY_PLAYLIST_ID`, el endpoint responde 503 y la tarjeta ni se renderiza.

### Variables de entorno (`.env`, git-ignorado)
Se acceden con `import.meta.env.*`. En producción deben configurarse en Vercel.

| Variable | Requerida | Para |
| :--- | :--- | :--- |
| `SPOTIFY_CLIENT_ID` | Sí | Spotify |
| `SPOTIFY_CLIENT_SECRET` | Sí | Spotify |
| `SPOTIFY_REFRESH_TOKEN` | Sí | Spotify — necesita los scopes `playlist-modify-public` (recomendador) y `user-top-read` (top del mes) |
| `SPOTIFY_PLAYLIST_ID` | Sí (recomendador) | Playlist destino de las canciones recomendadas |
| `TELEGRAM_BOT_TOKEN` | No | Aviso de nueva recomendación |
| `TELEGRAM_CHAT_ID` | No | Aviso de nueva recomendación |
| `PSN_GIST_ID` | Sí (PS) | Gist del que el sitio lee la cache de PlayStation |
| `GITHUB_USERNAME` | No | GitHub (default: `Davidciro-333`), también dueño del Gist |
| `GITHUB_TOKEN` | Recomendada | GitHub — sin él no hay contribuciones ni heatmap. Con scope `repo` incluye además los repos privados |

**Secrets del repo de GitHub** (para el job `psn-cache`, se configuran con `gh secret set`):

| Secret | Para |
| :--- | :--- |
| `PSN_NPSSO` | Auth de PSN — token de 64 caracteres, **caduca ~2 meses** |
| `PSN_GIST_ID` | Gist destino |
| `PSN_GIST_TOKEN` | PAT de GitHub **con scope `gist`** (el `GITHUB_TOKEN` por defecto de Actions no puede escribir gists) |

**Cómo renovar el `PSN_NPSSO` (cada ~2 meses):**
1. Inicia sesión en https://www.playstation.com en el navegador.
2. En la misma sesión, abre https://ca.account.sony.com/api/v1/ssocookie
3. Copia el valor de `npsso` (64 caracteres).
4. Actualiza el secret del repo: `gh secret set PSN_NPSSO --repo Davidciro-333/ciro-bio-link-page` (y el `.env` local si quieres el fallback en dev). **No hace falta redeploy**: el sitio lee del Gist, no de PSN.

### Efectos visuales
`Layout.astro` dibuja en un canvas fijo 44 motas de polvo que caen despacio (se pausa con la pestaña oculta y no corre con movimiento reducido) y una niebla inferior. En la cabecera, un halo ámbar respira detrás del retrato, la frase se escribe sola y el ornamento se dibuja al cargar. Detalle y tiempos en DESIGN.md §7.

## Notas

- **Skills de diseño en el repo** (`.claude/skills/`): `impeccable`, `emil-design-eng`, `animate`, `gsap-core` y `reference-design-contract`, para seguir puliendo el Farol también desde Claude Code en la nube. Detalle y licencias en `.claude/skills/README.md`.
- El `README.md` es el genérico de Astro y **no** describe este proyecto; usa este CLAUDE.md.
- Hay archivos sueltos en la raíz (`proposal-1-deep-space-v2.html`, `tweaks-panel.jsx`) que son bocetos del diseño anterior, no forman parte del build de Astro.
- Deploy: Vercel (build estático + funciones para los endpoints `/api/*`).

## Roadmap

- **Fase 2 — Chat IA ("clon"):** mini-chat con Claude que responde preguntas sobre David (portafolio, experiencia). Requisitos acordados: **límite de mensajes** por usuario/sesión y **no exponer información privada** (solo datos públicos del perfil). Implica un endpoint serverless nuevo + rate limiting; tiene costo por uso. Aún no implementado.
- **Mostrar la playlist de recomendaciones** en la página, como widget propio (las canciones ya se acumulan ahí).
- Posibles integraciones futuras evaluadas: WakaTime (horas de código), Steam (gaming en PC), Discord/Lanyard (presencia en tiempo real), tarjeta de trofeos de PlayStation.
