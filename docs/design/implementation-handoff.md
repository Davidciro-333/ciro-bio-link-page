# Implementation handoff · Farol

Instrucciones para implementar el diseño en el sitio real. Pegar tal cual en la siguiente sesión.

## Leer primero

1. [`DESIGN.md`](../../DESIGN.md): contrato visual, manda sobre todo lo demás.
2. [`propuestas/5-farol-v2.html`](../../propuestas/5-farol-v2.html): referencia viva (HTML/CSS/JS sin dependencias). Datos en `propuestas/assets/data.js`.
3. [`CLAUDE.md`](../../CLAUDE.md): arquitectura de los widgets y endpoints. **No tocar la lógica de los endpoints `/api/*`**; el rediseño es de presentación.
4. [`design-contract.md`](design-contract.md): qué se toma de cada referencia y el quality gate.

## Alcance

- Reescribir `src/styles/global.css` con los tokens de §2 a §7 de DESIGN.md. Eliminar las paletas `silver`/`obsidian`, el tema claro y las variables que ya no se usan.
- `src/layouts/Layout.astro`: quitar orbes, estrellas, cursor glow y el script de tema; `<html lang="es">` sin `data-theme`/`data-palette`. Añadir el canvas de polvo y la niebla. Cambiar las fuentes a Cormorant Garamond (500, 600, 500i) + Alegreya Sans (400, 500, 700).
- Eliminar `ThemeToggle.astro` y su uso.
- `src/pages/index.astro`: nueva estructura (cabecera centrada → ornamento → enlaces → "Mi diario" con 3 entradas).
- Nuevos componentes sugeridos: `Hero.astro`, `Ornament.astro`, `Journal.astro` (tablist + panels), y reestilar los widgets existentes dentro de cada panel: Música (`SpotifyCard`, `RecentlyPlayedCard`, nuevo `TopTracksCard`, `RecommendSongCard`), Juegos (`PlayStationCard` + `PlayStationRecentlyPlayedCard`), Código (`GitHubCard`).
- `profile_design_system.json`: añadir `profile.handle: "@itsciro.me"` y `profile.line: "Aquí guardo lo que escucho, lo que juego y lo que construyo."`. Reordenar `main_links` a: Mi Portafolio, Instagram, LinkedIn, Facebook. Borrar el bloque `theme` (ya no aplica).
- `privacidad.astro`: mismo fondo, tipografía y tokens; sin diario.

## Restricciones obligatorias

- **Color:** solo los tokens de §2. Un acento: `--lamp #e6b85c`. Logos de Spotify/PlayStation/GitHub en `currentColor`.
- **Tipografía:** tamaños y roles de la tabla de §3. Mínimo 13px. Sin mayúsculas con tracking.
- **Layout:** columna de 460px, gutter 22px. Cabecera y enlaces centrados; diario a la izquierda. Una entrada abierta a la vez, Música por defecto.
- **Componentes:** enlaces sin cajas con rombos; juegos recientes en círculos con doble anillo (6, en rejilla de 3); repos privados como `<div>` con "privado".
- **Movimiento:** tokens de §7. CSS + JS vanilla es suficiente; GSAP **no** es necesario (si se usa, solo para la cascada de entrada). Pausar el canvas con `document.hidden`. Todo se apaga con `prefers-reduced-motion`.
- **Accesibilidad:** el diario es un `tablist` con `aria-selected`, `aria-controls` y navegación con flechas, Inicio y Fin. Los widgets en vivo con `aria-live="polite"`. Foco visible en todo. Objetivos táctiles de 44px o más.

## Assets

- Retrato: `src/assets/profile-pic.png` (4096px, 17 MB) vía `<Image />` de `astro:assets` a 116px (con `densities` 2x). No usar la versión pixelada.
- Portadas de discos y juegos: las URLs que devuelven las APIs, sin recolorear. `width`/`height` explícitos para evitar CLS.
- Iconos: los SVG que ya existen en `src/components/icons/` y en `SocialIcons.astro`. No dibujar iconos nuevos.
- Ornamento: el SVG de `propuestas/5-farol-v2.html` (único SVG decorativo permitido).

## Responsive

- Diseño móvil primero a 375px; sin scroll horizontal desde 320px.
- En escritorio la columna sigue en 460px centrada; no hay layout de dos columnas.
- Probar 320, 375, 768 y 1440px.

## Dependencias previas

- **Top del mes:** regenerar `SPOTIFY_REFRESH_TOKEN` con el scope `user-top-read` añadido en `scripts/spotify-auth.mjs`; nuevo endpoint `src/pages/api/top-tracks.ts` (`/v1/me/top/artists` o `/tracks`, `time_range=short_term`, 5 elementos, `s-maxage` de 1 h). Si falta el scope, la pestaña "Más escuchados del mes" no se renderiza.

## El primer artefacto debe probar

1. La cabecera completa (retrato con halo, handle, nombre, título, frase que se escribe, redes, ornamento) y los 4 enlaces con el aspecto de `5-farol-v2.html`.
2. El diario con las 3 entradas funcionando con ratón y teclado, y Música con datos reales de Spotify, incluidos los estados vacío y de error.
3. Cero restos del diseño anterior (pasar el quality gate de `design-contract.md`).
4. `npm run build` sin errores y Lighthouse móvil con accesibilidad ≥ 95.

Pulido posterior con las skills `impeccable` y `emil-design-eng`; animaciones con `animate` (o GSAP solo si hace falta).
