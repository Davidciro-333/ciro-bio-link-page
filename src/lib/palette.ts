/**
 * Paleta de la portada para las olas de la música (como hace One UI). Se lee la
 * imagen en un canvas de 32×32 (i.scdn.co responde con CORS abierto), se
 * agrupan los píxeles por color y se eligen hasta 3 colores vivos y distintos.
 * Después se aclaran para que se lean sobre el fondo casi negro del Farol.
 *
 * Devuelve tripletas "r, g, b" (para usar en rgba(var(--x), a)), de la capa
 * más profunda a la más viva. `null` si la portada es gris/negra o no carga:
 * entonces las olas vuelven al ámbar de --lamp.
 */
export type Palette = [string, string, string];

const cache = new Map<string, Palette | null>();

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return `${f(0)}, ${f(8)}, ${f(4)}`;
}

const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function coverPalette(url: string | null | undefined): Promise<Palette | null> {
  if (!url) return null;
  if (cache.has(url)) return cache.get(url)!;
  let result: Palette | null = null;
  try {
    const img = await loadImage(url);
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const px = ctx.getImageData(0, 0, size, size).data;

    // Cubos de 4 bits por canal; cada cubo guarda su color medio y cuántos píxeles tiene.
    const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
    for (let i = 0; i < px.length; i += 4) {
      const key = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
      const bk = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
      bk.r += px[i]; bk.g += px[i + 1]; bk.b += px[i + 2]; bk.n++;
      buckets.set(key, bk);
    }

    const candidates = [...buckets.values()]
      .map((bk) => {
        const [h, s, l] = rgbToHsl(bk.r / bk.n, bk.g / bk.n, bk.b / bk.n);
        // Pesa la cantidad, pero premia lo saturado: el color de un disco rara vez es su fondo negro.
        return { h, s, l, score: bk.n * (0.25 + s) };
      })
      .filter((c) => c.s > 0.18 && c.l > 0.1 && c.l < 0.95)
      .sort((a, b) => b.score - a.score);

    const picked: typeof candidates = [];
    for (const c of candidates) {
      if (picked.every((p) => hueGap(p.h, c.h) > 0.06 || Math.abs(p.l - c.l) > 0.25)) picked.push(c);
      if (picked.length === 3) break;
    }

    if (picked.length) {
      while (picked.length < 3) picked.push(picked[picked.length - 1]);
      // El más saturado va a la capa viva, la línea y el rombo (--wv-3); los otros
      // dos, a las capas de fondo. Por cantidad ganaban la piel o el fondo crema de
      // la portada y la línea acababa casi ámbar. Todos aclarados para leerse sobre --bg.
      const order = [...picked].sort((a, b) => a.s - b.s);
      const lights = [0.52, 0.62, 0.68];
      result = order.map((c, i) => hslToRgb(c.h, Math.min(0.85, Math.max(0.4, c.s)), lights[i])) as Palette;
    }
  } catch {
    return null; // sin cache: se reintenta si vuelve la misma portada
  }
  cache.set(url, result);
  return result;
}

/** Aplica la paleta a las variables de las olas; `null` vuelve al ámbar. */
export function applyPalette(p: Palette | null): void {
  const root = document.documentElement.style;
  ['--wv-1', '--wv-2', '--wv-3'].forEach((name, i) => {
    if (p) root.setProperty(name, p[i]);
    else root.removeProperty(name);
  });
}
