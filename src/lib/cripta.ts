// Cripta del Saber: lee `public.json` del repo privado `cripta-datos` en el build (SDD de Cripta §4.9).
// Si falla, el build falla a propósito: Vercel sigue sirviendo el despliegue anterior y nunca se
// publica una Cripta vacía por error.
import { z } from 'astro/zod';

export const TIPOS = ['repo', 'skill', 'mcp', 'herramienta', 'guia', 'prompt', 'reel', 'video', 'articulo', 'idea'] as const;
export const NIVELES = ['principiante', 'intermedio', 'avanzado'] as const;
export type Tipo = (typeof TIPOS)[number];
export type Nivel = (typeof NIVELES)[number];

/** Etiqueta en singular y en plural (para los filtros). */
export const ETIQUETAS: Record<Tipo, [string, string]> = {
  repo: ['Repo', 'Repos'],
  skill: ['Skill', 'Skills'],
  mcp: ['MCP', 'MCP'],
  herramienta: ['Herramienta', 'Herramientas'],
  guia: ['Guía', 'Guías'],
  prompt: ['Prompt', 'Prompts'],
  reel: ['Reel', 'Reels'],
  video: ['Video', 'Videos'],
  articulo: ['Artículo', 'Artículos'],
  idea: ['Idea', 'Ideas'],
};

const Recurso = z.object({
  id: z.string().regex(/^cr_\d{8}_[0-9a-f]{6}$/),
  nombre: z.string().min(1).max(200),
  tipo: z.enum(TIPOS),
  descripcion: z.string().max(500).default(''),
  hashtags: z.array(z.string().max(60)).max(12).default([]),
  nivel: z.enum(NIVELES).nullable().optional(),
  // Solo http(s) o vacío (archivos de Telegram): nunca `javascript:` ni otros esquemas.
  url: z.string().max(2000).refine((u) => u === '' || /^https?:\/\//i.test(u), 'url no http(s)'),
  fuente: z.string().max(40).optional(),
  autor: z.string().max(100).nullable().optional(),
  publicado_en: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const Publico = z.object({ generado: z.string(), recursos: z.array(Recurso) });

export type Recurso = z.infer<typeof Recurso>;

export async function leerCripta(): Promise<{ generado: string; recursos: Recurso[] }> {
  const token = process.env.GITHUB_TOKEN ?? import.meta.env.GITHUB_TOKEN;
  const repo = process.env.CRIPTA_REPO ?? import.meta.env.CRIPTA_REPO ?? 'Davidciro-333/cripta-datos';
  if (!token) throw new Error('Cripta del Saber: falta GITHUB_TOKEN para leer public.json');

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/public.json`, {
    headers: { Accept: 'application/vnd.github.raw', Authorization: `Bearer ${token}`, 'User-Agent': 'itsciro-biolink' },
  });
  if (!res.ok) throw new Error(`Cripta del Saber: GitHub respondió ${res.status} al leer public.json`);

  const datos = Publico.parse(await res.json());
  const recursos = [...datos.recursos].sort((a, b) => b.publicado_en.localeCompare(a.publicado_en) || a.nombre.localeCompare(b.nombre));
  return { generado: datos.generado, recursos };
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «5 nov», o «5 nov 2025» si no es de este año. */
export function fechaCorta(iso: string, hoy = new Date()): string {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m! - 1]}${a !== hoy.getFullYear() ? ` ${a}` : ''}`;
}

/** Texto en minúsculas y sin tildes, para buscar. */
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
