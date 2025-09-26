import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind'; // Integración que añadiste
import vercel from '@astrojs/vercel/serverless'; // Adaptador que añadiste

export default defineConfig({
  output: 'server', // Le dice a Astro que prepare el sitio para un servidor
  adapter: vercel(), // Le dice a Astro cómo construir para Vercel
  integrations: [tailwind()] // Lista de todas tus integraciones
});