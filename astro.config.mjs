// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  // La hoja de estilos (~20 KB) va dentro del HTML: en móvil, pedirla aparte
  // bloqueaba el primer render un viaje de red más.
  build: { inlineStylesheets: 'always' },
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()]
  }
});