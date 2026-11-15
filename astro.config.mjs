// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { SITE_URL } from './src/lib/sitio.ts';

export default defineConfig({
  // URL absoluta para canonical y Open Graph (E17)
  site: SITE_URL,
  // Estático por defecto; las rutas que leen datos en cada petición optan por el servidor
  // con `export const prerender = false` (plan §3)
  output: 'static',
  // Cloudflare Workers, como el portafolio. `compile`: sharp optimiza las imágenes en el
  // build y en producción se sirven tal cual, sin el servicio de pago Cloudflare Images
  adapter: cloudflare({ imageService: 'compile' }),
  // La tienda no usa sesiones: sin esto, el adaptador crea un KV para guardarlas
  session: false,
  // Scripts y estilos siempre como archivos: la CSP solo necesita `self` (plan §8)
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
