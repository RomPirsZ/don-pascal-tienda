import { defineMiddleware } from 'astro:middleware';
import { withSecurityHeaders } from './lib/server-headers';

// public/_headers solo llega a lo estático (plan §8). Lo que genera el código del Worker (las páginas
// del catálogo, /_image y las rutas de /api) recibe aquí lo que le falte
// (auditoría de seguridad del portafolio, 2026-11-10). Las páginas prerenderizadas no se tocan: sus cabeceras son las de
// _headers. El 403 de `checkOrigin` no pasa por aquí: Astro lo responde antes.
// En `astro dev` no se ponen: Vite inyecta los estilos y su cliente como bloques en línea,
// que la CSP bloquea, y la página se vería sin estilos. El build (y los e2e, que lo prueban)
// sí las lleva.
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (import.meta.env.DEV || context.isPrerendered) return response;
  return withSecurityHeaders(response);
});
