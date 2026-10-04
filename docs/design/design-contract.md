# Design contract · Farol

Registro de decisiones del rediseño del bio-link. Fecha de cierre: 2026-10-04.
Contrato visual: [`DESIGN.md`](../../DESIGN.md). Construcción: [`implementation-handoff.md`](implementation-handoff.md).

## Objetivo y artefacto

- **Artefacto:** rediseño visual completo de `ciro-bio-link-page` (Astro 5, una sola página `src/pages/index.astro` + `privacidad.astro`). Se conserva toda la funcionalidad: enlaces, widgets en vivo de Spotify, PlayStation y GitHub, y el recomendador de canciones.
- **Público, por prioridad:** (1) amigos y seguidores que llegan desde Instagram/Facebook, (2) gente del mundo gamer y creativo. Los reclutadores pasan a segundo plano. Tráfico mayoritariamente móvil.
- **Sensación buscada:** "esto es muy él" (íntimo, como entrar en su cuarto), luego "qué bien hecho", con un poco de calma y de juego.
- **Palabras de marca:** creativo, cercano, gamer.

## Evidencia

| Fuente | Qué aportó | Confianza |
| :--- | :--- | :--- |
| Brief con el usuario (5 preguntas, 2026-10-04) | Palabras de marca, público, sensación, límites (solo oscuro, todos los widgets, abierto a avatar ilustrado) | provided |
| Referencias del usuario | Juegos retro 8/16 bits, Hollow Knight, menú de PS2, Spotify, Claude, minimalismo, pixel art. Descartados: estilos aparatosos, Y2K, streetwear, vaporwave, anime | provided |
| Auditoría del sitio actual (código + navegador a 375px) | Nota media ~4.5/10; lista de rasgos genéricos o "de IA" (ver §9 de DESIGN.md) | observed |
| Datos reales de los endpoints locales | Últimas escuchas (Ozzy Osbourne, Black Sabbath, Scorpions, Chicago, Prince Royce), 6 juegos recientes de PSN, 4 repos públicos | observed |
| `awesome-design-md`: Claude, Spotify, PlayStation | Calidez editorial; contenido primero con la carátula como color; calma sin decoración | observed |
| 4 mockups en `propuestas/` + Farol v2 | Preferencia del usuario: 2 > 3 > 1; la 4 descartada por vista en otras páginas, salvo el `@itsciro.me` | provided |
| Iteración sobre Farol v2 | Enlaces y juegos devueltos al estilo de la v1 (texto centrado; reliquias circulares). Frase final elegida (opción 5) | provided |
| Contraste WCAG | Calculado con script propio: texto 15.5:1, muted 7.4:1, lamp 10.5:1 sobre `#0b0d11` | observed |

## Keep / Change / Do not copy

| Referencia | Keep | Change | Do not copy |
| :--- | :--- | :--- | :--- |
| **Hollow Knight** (base) | Oscuridad de tinta, polvo que cae, trazo fino, el "Diario del cazador" como forma de listar cosas, una luz cálida en la oscuridad | Llevado a interfaz web legible: una sola floritura, sans para el texto, contenido real | Personajes, arte, logotipos, tipografía del juego, iconografía, nombres propios (Hallownest, etc.) |
| **Menú de PS2 / Memory Card** (propuesta 1) | Ritmo lento que respira; el borde que se ilumina al seleccionar; tres "partidas" como selector | El brillo azul y el blur pasan a luz de farol ámbar; las torres de cubos no se usan | Torres de luz del BIOS, sonidos, logos de PlayStation 2, UI propietaria de Sony |
| **Cartucho / 8-16 bits** (propuesta 3) | Texto que se escribe solo; la barra de progreso como algo "del juego" | Barra de vida segmentada pasa a hilo con gema; el cuadro de diálogo pasa a una frase con cursor de pluma | Fuentes pixel, bordes pixelados, avatar pixelado, el ▶ y el ▼ de RPG |
| **Lado B / Claude + Spotify** (propuesta 4) | El `@itsciro.me` junto al retrato; la regla de "contenido primero" | Nada más de esta propuesta pasa al diseño final | Paleta coral de Claude, serif Newsreader, carátula que tiñe la página, vinilo |
| **Spotify** | Las portadas como fuente de color dentro de las filas | Su verde no se usa en la interfaz | Logo recoloreado, UI de reproductor, Circular |
| **Sitio actual** | Toda la funcionalidad y los datos de los widgets; `profile_design_system.json` como fuente del contenido | Todo lo visual | Glassmorphism, orbes, estrellas, anillo girando, nombre con degradado, cursor glow |

## Postura final

El sitio es **un diario a la luz de un farol**: tinta azulada casi negra, texto color hueso y una sola luz ámbar que marca lo vivo, lo seleccionado y lo que está bajo el cursor. La cabecera y los enlaces son centrados y tipográficos (Cormorant Garamond), sin cajas. Debajo, "Mi diario" agrupa la música, los juegos y el código en tres entradas que se eligen como partidas guardadas; solo una está abierta a la vez. Todo se mueve despacio y respira; nada rebota. Lo gamer está en el contenido (portadas de juegos, PlayStation en vivo, el diario como menú), no en un disfraz retro.

## Riesgos y desconocidos

- **Caer en disfraz gótico.** Mitigación: un solo ornamento, Cormorant solo en títulos y enlaces, anti-patterns explícitos.
- **Rendimiento del polvo en móviles viejos.** El canvas debe pausarse con la pestaña oculta y quedar estático con reduced motion. *(inferred)*
- **Widget "Más escuchados del mes" es nuevo:** necesita el scope `user-top-read`, que el refresh token actual no tiene. Hay que regenerarlo con `scripts/spotify-auth.mjs`.
- **Licencias de fuentes:** Cormorant Garamond y Alegreya Sans son OFL (Google Fonts). *(inferred, verificar al autohospedar)*
- **Contenido en vivo vacío:** la mayor parte del tiempo no suena nada y PSN está desconectado; los estados vacíos deben verse tan cuidados como los llenos.
- **Desconocido:** cuántas contribuciones y qué racha mostrará el heatmap real en producción (depende del `GITHUB_TOKEN` en Vercel).
- **Desconocido:** si el usuario quiere conservar `privacidad.astro` con el mismo diseño; se asume que sí *(inferred)*.

## Quality gate

El primer artefacto falla la revisión si:

- [ ] Aparece cualquier color de interfaz distinto de los tokens de §2 (en especial azul, violeta o verde).
- [ ] Algún texto baja de 13px o de contraste 4.5:1.
- [ ] Queda algún rasgo del diseño anterior listado en §9 (orbes, estrellas, glassmorphism, degradado en el nombre, toggle de tema).
- [ ] Los enlaces están dentro de cajas o no están centrados.
- [ ] Los juegos recientes no son círculos con doble anillo.
- [ ] Se ven las tres entradas del diario abiertas a la vez, o el selector no funciona con teclado.
- [ ] Algún widget muestra "Cargando..." o no tiene estado vacío y de error.
- [ ] Con `prefers-reduced-motion` sigue habiendo algo en movimiento.
- [ ] Un repo privado expone descripción, URL o estrellas.
- [ ] La página tiene scroll horizontal a 375px.
- [ ] Hay más de un ornamento o alguna floritura añadida.
