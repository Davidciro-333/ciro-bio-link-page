/**
 * Olas sobre el progreso de la canción, al estilo del reproductor de One UI:
 * capas translúcidas de ámbar que solo cubren lo ya sonado. Se dibujan en dos
 * sitios, el anillo del retrato y el hilo de "Ahora escuchando", con un único
 * requestAnimationFrame compartido.
 *
 * El ritmo sale del tempo real (ReccoBeats, vía /api/now-playing). Sin tempo no
 * se inventa un pulso: las olas fluyen despacio y bajitas. La fase del pulso no
 * está alineada con los golpes reales (no tenemos ese dato), solo la velocidad.
 *
 * Las olas cambian de forma en cada frame, así que se redibuja el `d` de unos
 * pocos paths SVG; es la única animación en bucle que no es transform/opacity
 * (excepción documentada en DESIGN.md §7). Se para con la pestaña oculta, sin
 * música, y con movimiento reducido queda fija y se actualiza una vez por segundo.
 */
import { reducedMotion } from './client';

export interface NowPlaying {
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  fetchedAt: number;
  tempo: number | null;
  energy: number | null;
}

interface Frame {
  t: number; // tiempo de la ola (ya escalado por el tempo)
  progress: number; // 0..1
  amp: number; // 0..1, altura de las olas
  kick: number; // 0..1, empujón en cada tiempo
  vis: number; // 0..1, aparición / desvanecido
}

type Renderer = (f: Frame) => boolean; // false = desmontado, se quita

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
// Tres capas con frecuencias distintas: de la más ancha y tenue a la más viva.
const LAYERS = [
  { f: 1.0, s: 2.0, o: 0.0, m: 0.7 },
  { f: 1.6, s: 3.1, o: 1.7, m: 0.85 },
  { f: 2.3, s: 4.3, o: 3.2, m: 1 },
];

let state: NowPlaying = { isPlaying: false, progressMs: 0, durationMs: 0, fetchedAt: 0, tempo: null, energy: null };
const renderers = new Set<Renderer>();
let vis = 0;
let last = 0;
let raf = 0;
let slow: ReturnType<typeof setTimeout> | null = null;

export function setNowPlaying(next: NowPlaying): void {
  state = next;
  wake();
}

function wave(u: number, t: number, k: number, kick: number): number {
  const l = LAYERS[k];
  return l.m * (0.55 + 0.45 * Math.sin(u * l.f * TAU - t * l.s + l.o)) * (0.85 + 0.15 * kick);
}

function progressNow(): number {
  if (!state.durationMs) return 0;
  const pos = state.progressMs + (state.isPlaying ? Date.now() - state.fetchedAt : 0);
  return Math.min(Math.max(pos / state.durationMs, 0), 1);
}

function frame(ts: number) {
  raf = 0;
  const reduce = reducedMotion();
  const target = state.isPlaying ? 1 : 0;
  const dt = last ? Math.min((ts - last) / 1000, 0.1) : 0.016;
  last = ts;
  vis = reduce ? target : vis + (target - vis) * (1 - Math.exp(-dt * 2.2));
  if (Math.abs(target - vis) < 0.003) vis = target;

  const tempo = state.tempo;
  const energy = state.energy ?? 0.3;
  const seconds = reduce ? 0 : ts / 1000;
  const beat = tempo ? (seconds * tempo) / 60 : 0;
  const f: Frame = {
    // Más lento que el tempo literal: a 1:1 las olas se sentían nerviosas.
    t: seconds * (tempo ? tempo / 160 : 0.3),
    progress: progressNow(),
    amp: tempo ? 0.4 + 0.6 * energy : 0.35,
    kick: tempo && !reduce ? Math.pow(1 - (beat % 1), 3) : 0,
    vis,
  };
  renderers.forEach((r) => {
    if (!r(f)) renderers.delete(r);
  });

  if ((vis === 0 && !state.isPlaying) || document.hidden || renderers.size === 0) return;
  if (reduce) {
    slow = setTimeout(() => {
      slow = null;
      wake();
    }, 1000);
    return;
  }
  raf = requestAnimationFrame(frame);
}

function wake() {
  if (raf || slow) return;
  raf = requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  last = 0;
  wake();
});

function el<K extends keyof SVGElementTagNameMap>(tag: K, cls: string, parent: Element): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  node.setAttribute('class', cls);
  parent.appendChild(node);
  return node;
}

const n2 = (v: number) => v.toFixed(2);

// En el anillo cada capa da un número entero de ondas por vuelta, para que la
// ola cierre sin corte en lo alto del retrato. La fase resta el tiempo: así las
// crestas avanzan en el sentido del reloj (y hacia la derecha en el hilo).
const RING_CYCLES = [3, 5, 8];
function ringWave(a: number, t: number, k: number, kick: number): number {
  const l = LAYERS[k];
  return l.m * (0.55 + 0.45 * Math.sin(a * RING_CYCLES[k] - t * l.s + l.o)) * (0.85 + 0.15 * kick);
}

/**
 * Anillo de olas alrededor de todo el retrato (sin línea de progreso: el
 * progreso ya lo cuenta el hilo de la tarjeta). El SVG va centrado en (0,0).
 */
export function mountRing(svg: SVGSVGElement, r0 = 66, maxH = 14): void {
  const layers = LAYERS.map((_, k) => el('path', `wv wv-${k + 1}`, svg));
  const STEPS = 180; // puntos por vuelta

  renderers.add((f) => {
    if (!svg.isConnected) return false;
    svg.style.opacity = String(f.vis);
    if (f.vis === 0) return true;
    layers.forEach((p, k) => {
      let top = '';
      let base = '';
      for (let i = 0; i <= STEPS; i++) {
        const a = (i / STEPS) * TAU;
        const r = r0 + 0.5 + maxH * f.amp * f.vis * ringWave(a, f.t, k, f.kick);
        top += `${i ? 'L' : 'M'}${n2(r * Math.sin(a))} ${n2(-r * Math.cos(a))}`;
        base = `L${n2(r0 * Math.sin(a))} ${n2(-r0 * Math.cos(a))}` + base;
      }
      p.setAttribute('d', top + base + 'Z');
    });
    return true;
  });
  wake();
}

/** Olas sobre el hilo de progreso. La línea y la gema siguen siendo el HTML del hilo. */
export function mountThread(svg: SVGSVGElement, maxH = 14): void {
  const layers = LAYERS.map((_, k) => el('path', `wv wv-${k + 1}`, svg));
  const h = maxH + 2;
  let w = svg.clientWidth || 300;
  new ResizeObserver(() => {
    w = svg.clientWidth || w;
  }).observe(svg);

  renderers.add((f) => {
    if (!svg.isConnected) return false;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const end = f.progress * w;
    const m = Math.max(2, Math.round(end / 3));
    layers.forEach((p, k) => {
      let d = `M0 ${h}`;
      for (let i = 0; i <= m; i++) {
        const x = (i / m) * end;
        const taper = Math.min(1, i / 6, (m - i) / 5);
        d += `L${n2(x)} ${n2(h - 0.5 - maxH * f.amp * f.vis * taper * wave((x / w) * 1.6, f.t, k, f.kick))}`;
      }
      p.setAttribute('d', d + `L${n2(end)} ${h}Z`);
    });
    return true;
  });
  wake();
}
