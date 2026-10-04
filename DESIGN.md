# DESIGN.md · Farol

Contrato visual del bio-link de David Ciro (`ciro-bio-link-page`). Dirección elegida el 2026-10-04 tras comparar 4 propuestas. La referencia viva es [`propuestas/5-farol-v2.html`](propuestas/5-farol-v2.html): si este documento y el mockup discrepan, manda este documento.

Decisiones y evidencia: [`docs/design/design-contract.md`](docs/design/design-contract.md). Instrucciones de construcción: [`docs/design/implementation-handoff.md`](docs/design/implementation-handoff.md).

---

## 1. Visual Theme & Atmosphere

**Un diario a la luz de un farol, en la oscuridad.** La página es el cuarto de David: lo que escucha, lo que juega y lo que construye, en vivo. Inspirado en la atmósfera de Hollow Knight (tinta, polvo que cae, trazo fino) y en la calma del menú de la PS2 (cosas que respiran despacio).

- **Sensación objetivo:** "esto es muy él" primero, "qué bien hecho" después, con un fondo de calma y un guiño de juego.
- **Una sola fuente de luz:** el ámbar del farol. Todo lo que está activo, en vivo o bajo el cursor se *ilumina* con esa luz. Nada más brilla.
- **Solo tema oscuro.** No hay modo claro ni paletas alternativas.
- **Densidad baja:** una columna estrecha, mucho negro alrededor, pocos elementos con intención.
- **Lo gamer viene del contenido** (portadas de juegos, PlayStation, el diario como menú), no de un disfraz retro: nada de pixel art ni de tipografías de videojuego.

## 2. Color

Todos los colores van como custom properties en `:root`. No se usan colores fuera de esta tabla salvo los que vienen del contenido (carátulas, portadas, colores de lenguaje de GitHub).

| Token | Valor | Uso | Contraste sobre `--bg` |
| :--- | :--- | :--- | :--- |
| `--bg` | `#0b0d11` | Fondo de página (tinta azulada, nunca `#000`) | |
| `--surface` | `#11141a` | Fondo de tarjetas: entradas del diario, buscador | |
| `--ink-line` | `rgba(235,229,213,0.11)` | Bordes de 1 px, separadores, anillos | |
| `--text` | `#ebe5d5` | Texto principal (hueso cálido, nunca `#fff`) | 15.5:1 |
| `--muted` | `#98a0aa` | Texto secundario, metadatos, iconos en reposo | 7.4:1 |
| `--lamp` | `#e6b85c` | **Único acento.** Estado en vivo, selección, hover, enlace principal | 10.5:1 |
| `--lamp-rgb` | `230, 184, 92` | El mismo ámbar para `rgba()` | |

**Atmósfera (solo decorativa, fija, `pointer-events: none`):**
- Niebla inferior: `radial-gradient(70% 38% at 50% 100%, rgba(111,130,150,0.16), transparent 70%)`.
- Halo del farol detrás del retrato: `radial-gradient(circle, rgba(var(--lamp-rgb),0.22), transparent 62%)`.

**Luz de farol (`--glow`)**, el "borde que brilla":
```css
--glow: 0 0 0 1px rgba(var(--lamp-rgb), 0.55),
        0 0 22px rgba(var(--lamp-rgb), 0.16),
        inset 0 0 18px rgba(var(--lamp-rgb), 0.06);
```

**Heatmap de GitHub:** 5 niveles del mismo ámbar: `rgba(235,229,213,0.06)`, luego `--lamp` al 25 %, 45 % y 70 %, y `--lamp` sólido con `box-shadow: 0 0 6px` al 60 %.

**Reglas:**
- El verde de Spotify y el azul de PlayStation **no** se usan como color de interfaz. Sus logos van en `currentColor` (muted o lamp).
- Contraste mínimo: 4.5:1 para cualquier texto. La paleta actual está por encima de 7:1; no bajar `--muted` de `#98a0aa`.

## 3. Typography

Dos familias autoalojadas con Fontsource (`@fontsource-variable/cormorant-garamond` y `@fontsource/alegreya-sans`), con `preload` del subset latino:

| Rol | Familia | Pesos |
| :--- | :--- | :--- |
| Display (nombre, títulos, enlaces, nombres de entrada, metadatos poéticos) | **Cormorant Garamond** | 500, 600, 500 itálica |
| Texto y UI (cuerpo, filas, botones, etiquetas) | **Alegreya Sans** | 400, 500, 700 |

| Estilo | Familia | Tamaño | Peso | Line-height | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Nombre (`h1`) | Cormorant | 46px | 600 | 1 | |
| Título bajo el nombre | Cormorant | 20px | 500 itálica | 1.2 | color `--muted` |
| Enlaces principales | Cormorant | 26px | 500 | 1.2 | el primero en itálica y `--lamp` |
| Título de sección (`h2`) | Cormorant | 28px | 600 | 1.1 | |
| Destacado (canción/juego actual) | Cormorant | 25px | 600 | 1.1 | |
| Nombre de entrada del diario | Cormorant | 21px | 600 | 1 | |
| Cifra grande (contribuciones) | Cormorant | 54px | 500 | 1 | `--lamp` con `text-shadow` suave |
| Metadato poético ("hace 8 d", "privado") | Cormorant | 16px | 500 itálica | 1.2 | `--muted` |
| Cuerpo / frase de presentación | Alegreya Sans | 16px | 400 | 1.6 | máx. 32ch |
| Filas (título de canción, repo) | Alegreya Sans | 16px | 500 | 1.4 | |
| Secundario de fila | Alegreya Sans | 14px | 400 | 1.4 | `--muted` |
| Etiqueta de estado ("Sonando ahora") | Alegreya Sans | 13px | 500 | 1 | `--lamp`, `letter-spacing: .02em` |
| Handle `@itsciro.me` | Alegreya Sans | 14px | 400 | 1 | `--muted`, `letter-spacing: .04em` |

**Reglas:**
- Tamaño mínimo absoluto: **13px**.
- Nada en MAYÚSCULAS con tracking ancho (las "eyebrows" del diseño anterior desaparecen).
- Números en vivo (tiempos, conteos) con `font-variant-numeric: tabular-nums`.
- Cormorant nunca para párrafos ni para texto de menos de 15px.

## 4. Spacing & Grid

- **Columna única** centrada: `max-width: 460px`, padding `60px 22px 72px`. Gutter lateral de 22px en móvil, igual en escritorio (la página no se ensancha).
- **Escala:** 4 · 8 · 10 · 14 · 18 · 22 · 26 · 30 · 54 px.
- **Ritmo vertical:**
  - Retrato a handle: 22px. Handle a nombre: 6px. Nombre a título: 8px. Título a frase: 16px. Frase a redes: 18px.
  - Ornamento: 30px arriba, 26px abajo.
  - Enlaces: 4px entre filas (8px de padding vertical en cada una).
  - Antes de "Mi diario": 54px. Selector a contenido: 22px.
  - Footer: 56px arriba.
- **Rejillas internas:**
  - Selector del diario: 3 columnas iguales, gap 10px.
  - Juegos recientes: 3 columnas, gap 14px, siempre en múltiplos de 3 (6 juegos).
  - Fila de canción/nota: `44px 1fr auto`, gap 14px.
  - Destacado: `96px 1fr`, gap 18px.
- **Radios:** 6px en tarjetas y botones; 4px en portadas cuadradas; 3px en miniaturas de 44px; 50% en retrato, redes y portadas de juegos recientes. No hay otros radios.

## 5. Layout & Composition

Orden fijo de arriba abajo:

1. **Cabecera (centrada):** retrato con halo, `@itsciro.me`, nombre, título, frase que se escribe sola, redes.
2. **Ornamento:** línea fina con un rombo ámbar en el centro. Es el único ornamento de la página.
3. **Enlaces (centrados):** Mi Portafolio (destacado), Instagram, LinkedIn, Facebook. Texto, sin cajas.
4. **Mi diario:** título alineado a la izquierda con una línea que se desvanece; debajo, el selector de tres entradas (Música, Juegos, Código) y la página de la entrada activa.
   - **Música:** canción actual (portada 96px, estado, título, artista) → hilo de progreso → pestañas *Últimas / Más escuchados del mes* → lista de 5 filas → "Déjame una canción" (buscador).
   - **Juegos:** juego actual (portada 96px, estado, título, consola y tiempo) → 6 juegos recientes en círculos con doble anillo.
   - **Código:** cifra de contribuciones del mes + racha → heatmap del último año → los 5 repos más recientes (los privados sin enlace, con "privado").
5. **Footer:** Política de privacidad a la izquierda.

**Reglas de composición:**
- La cabecera y los enlaces van **centrados**; todo lo del diario va **alineado a la izquierda**. No mezclar dentro de un bloque.
- Una sola entrada del diario visible a la vez. La entrada por defecto es **Música**.
- No hay toggle de tema, ni botones flotantes fijos sobre el contenido.

## 6. Components

**Retrato.** 116px, círculo, `filter: saturate(.78) contrast(1.05)`. Doble anillo: `0 0 0 1px rgba(235,229,213,.35), 0 0 0 7px var(--bg), 0 0 0 8px var(--ink-line)`. Detrás, el halo del farol (`inset: -60px`) que respira.

**Redes.** Botones circulares de 44px, icono 17px en `--muted`. Hover/focus: icono `--lamp`, `box-shadow: var(--glow)`, `translateY(-2px)`. Siempre con `aria-label`.

**Ornamento.** SVG de 200×22px, trazo de 1px en `--text` al 55 %, con un rombo `--lamp` de 8px en el centro.

**Enlace principal.** Cormorant 26px, centrado, con un rombo de 7px a cada lado (`transform: rotate(45deg)`) invisible en reposo. Hover/focus: texto `--lamp`, rombos visibles rellenos de `--lamp` con `box-shadow: 0 0 8px`. El primer enlace (Mi Portafolio) está siempre en itálica `--lamp`.

**Entrada del diario (tab).** Botón `role="tab"`, fondo `--surface`, borde `0 0 0 1px var(--ink-line)`, radio 6px, padding `14px 12px`, alto mínimo 104px. Contiene icono 18px, nombre (Cormorant 21px) y meta (13px: "sonando ahora", "jugando ahora", "171 este mes").
- Hover: `translateY(-2px)`, borde ámbar al 30 %.
- Seleccionada: `box-shadow: var(--glow)`, `translateY(-3px)`, fondo `linear-gradient(180deg, rgba(lamp,.08), var(--surface))`, icono `--lamp`.
- Focus visible: `outline: 1px dashed var(--lamp); outline-offset: 4px`.

**Indicador en vivo.** Punto de 6px `--lamp` con `box-shadow: 0 0 10px` que parpadea como una llama + etiqueta de estado. Solo aparece cuando el dato está realmente en vivo.

**Hilo con gema (progreso).** Línea de 1px en `--ink-line`; el tramo recorrido es un degradado de ámbar al 20 % a `--lamp`, y termina en un rombo de 8px con brillo. Debajo, tiempos 13px en `--muted`.

**Pestañas de texto** (Últimas / Más escuchados del mes). Texto 15px `--muted`; la activa en `--text` con subrayado de 1px `--lamp`.

**Fila (canción, nota).** Miniatura 44px radio 3px (`saturate(.85)`), título 500, secundario 14px `--muted`, metadato en Cormorant itálica. Separador de 1px entre filas. Hover: la fila se ilumina con `--glow` (radio 6px).

**Buscador "Déjame una canción".** Tarjeta `--surface` radio 6px, título Cormorant 23px, texto de apoyo 15px, input sin caja con línea inferior de 1px `--muted`. Al enfocar, la tarjeta recibe `--glow` y la línea pasa a `--lamp`. Label visible siempre (nunca solo placeholder).

**Reliquias (juegos recientes).** Portada circular con doble anillo (`0 0 0 1px ink-line, 0 0 0 5px bg, 0 0 0 6px ink-line`), `saturate(.8)`. Debajo, nombre 13px y fecha en Cormorant itálica 15px. Hover: `saturate(1.1)`, `translateY(-3px)` y el anillo exterior se enciende en ámbar al 70 % con un halo de 22px.

**Repo.** Nombre 500 a la izquierda y fecha ("hace 5 d") a la derecha en Cormorant itálica, igual que el resto de listas. Debajo, en 15px `--muted`: lenguaje o "privado" (más "en {organización}" si es una contribución) y, si es público, la descripción recortada a 2 líneas. Los públicos son enlaces y se iluminan con `--glow` al hover; los privados son `<div>` sin hover.

**Estados de carga, vacío y error** (obligatorios en cada widget):
- *Cargando:* la estructura final con bloques en `--ink-line` que respiran (opacidad .4 ↔ .8, 2.4s). Nunca el texto "Cargando...".
- *Vacío:* frase en Alegreya Sans 15px `--muted` dentro del mismo hueco. Ej.: "Ahora no suena nada. Esto es lo último que escuché.", "Desconectado. Última partida: Fortnite, hace 8 d."
- *Error:* "No pude leer Spotify ahora mismo." en `--muted`, sin rojo. El resto de la página sigue funcionando.

## 7. Motion & Interaction

**Actitud:** lento, cálido, sin rebotes. Todo respira; nada salta.

| Token | Valor |
| :--- | :--- |
| `--ease` | `cubic-bezier(0.25, 1, 0.5, 1)` |
| `--slow` | `0.7s` (hover, foco, selección) |
| Cambios de color sueltos | `0.4s` |

| Movimiento | Detalle |
| :--- | :--- |
| Entrada de la página | Cabecera y enlaces aparecen en cascada: `opacity 0 → 1`, `translateY(10px) → 0`, `blur(4px) → 0`, 1.2s, retrasos de 0.08s entre elementos (de 0 a 0.55s). |
| Halo del farol | Escala .94 ↔ 1.04 y opacidad .65 ↔ 1, ciclo de 7s, `ease-in-out`, infinito. |
| Frase de presentación | Se escribe sola letra a letra (38 a 78 ms por letra, irregular, como a mano), empieza a 1.1s; cursor vertical de 1px `--lamp` que parpadea. Con `aria-live="polite"`. |
| Ornamento | El trazo se dibuja (`stroke-dashoffset`) en 2.4s desde 0.3s; el rombo aparece a 1.8s. |
| Polvo | Canvas fijo: 44 motas de 0.6 a 2.2px que caen a 0.07 a 0.29 px/frame con vaivén lateral; el 30 % son cálidas (ámbar). Respeta `devicePixelRatio` (máx. 2). |
| Llama (indicador en vivo) | Parpadeo irregular de opacidad 1 → .55 → .9 → .6, 3.2s. |
| Cambio de entrada del diario | La página nueva entra con `opacity 0 → 1`, `translateY(8px) → 0`, `blur(4px) → 0` en 0.9s. |
| Hilo de progreso | Avanza cada 1s con `transition: width 1s linear`, interpolado localmente entre fetches. |
| Hover/focus | Ver componentes: la respuesta es siempre "acercar el farol" (`--glow`, color `--lamp`) y como mucho `translateY(-2px/-3px)`. |

**Reglas:**
- Solo se animan `transform`, `opacity`, `filter` y `box-shadow`. Nunca `width/height/top/left` (excepto el hilo de progreso, de 1px).
- `prefers-reduced-motion: reduce`: se apagan polvo, halo, llama, escritura (la frase aparece completa), ornamento (aparece dibujado) y el avance del hilo; las transiciones bajan a 0.01ms.
- Teclado: las entradas del diario son un `tablist` con flechas izquierda/derecha, Inicio y Fin. Todo lo interactivo tiene foco visible.
- Táctil: objetivos de al menos 44×44px.

## 8. Voice & Brand

- **Idioma:** español, tuteo, frases cortas y en primera persona.
- **Tono:** cercano y tranquilo, con un punto de humor. Ni corporativo ni "marketing".
- **Frase de presentación:** "Aquí guardo lo que escucho, lo que juego y lo que construyo."
- **Nombres de sección:** "Mi diario", "Música", "Juegos", "Código", "Déjame una canción", "Últimas", "Más escuchados del mes".
- **Estados:** "Sonando ahora", "Jugando ahora", "privado", "hace 8 d", "desde hace 38 min".
- **Identidad:** nombre "David Ciro", título "Desarrollador de software", handle `@itsciro.me`, foto real (no avatar ilustrado).
- **Marcas de terceros** (Spotify, PlayStation, GitHub, juegos, discos): solo sus logos e imágenes oficiales tal cual llegan de sus APIs, nunca recoloreadas ni usadas como decoración.

## 9. Anti-patterns

Prohibido en este sitio:

- **Del diseño anterior:** glassmorphism (`backdrop-filter`), orbes de colores desenfocados, estrellas parpadeantes, anillo cónico girando alrededor del avatar, nombre con degradado (`background-clip: text`), brillo diagonal que barre los botones, glow radial que sigue al cursor, toggle de tema con emoji.
- **Colores:** cualquier azul, violeta, verde neón o degradado de color en la interfaz. Un segundo acento además de `--lamp`. Blanco puro `#fff` o negro puro `#000`.
- **Tipografía:** Space Grotesk, Inter, fuentes pixel (Press Start 2P, Silkscreen, Pixelify), etiquetas en mayúsculas con tracking ancho, texto de menos de 13px, Cormorant en párrafos.
- **Ornamentación:** más de un ornamento, florituras góticas, marcos, calaveras, texturas de pergamino, ilustraciones SVG hechas a mano. Si empieza a parecer disfraz de Hollow Knight, sobra.
- **Estructura:** tarjetas idénticas apiladas para cada widget, enlaces dentro de cajas, contenido de los widgets todos visibles a la vez, iconos sociales duplicados como botones grandes.
- **Movimiento:** rebotes o `spring` con overshoot, animaciones rápidas (< 0.3s) en hover, cosas que se mueven sin motivo, `window.addEventListener('scroll')` para animar.
- **Contenido:** emojis como iconos, guiones largos (—) en la copy, texto "Cargando...", datos inventados presentados como reales, mostrar descripción/URL/estrellas de repos privados.
