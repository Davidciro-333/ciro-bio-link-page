// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  // Web Analytics de Vercel: visitas sin cookies, script servido desde el propio dominio.
  // También hay que activarlo en el dashboard (proyecto → Analytics → Enable).
  adapter: vercel({ webAnalytics: { enabled: true } }),
  // La hoja de estilos (~20 KB) va dentro del HTML: en móvil, pedirla aparte
  // bloqueaba el primer render un viaje de red más.
  build: { inlineStylesheets: 'always' },
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()]
  }
});