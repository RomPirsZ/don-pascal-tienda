// Cabeceras de seguridad de lo que responde el código del Worker (copiado del portafolio y
// ampliado). public/_headers solo llega a lo estático (plan §8). Aquí las páginas se generan
// en cada petición (plan §4), así que llevan las mismas cabeceras que _headers (PAGE, un
// test vigila que coincidan); el resto (rutas de /api, /_image) lleva la base estricta.
// Sin dependencias: los e2e las importan.

export const SERVER_SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

/** Las de la regla `/*` de public/_headers, para las páginas HTML que genera el Worker. */
export const PAGE_SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), hid=(), idle-detection=(), local-fonts=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-create=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), window-management=(), xr-spatial-tracking=()',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
} as const;

/**
 * Devuelve la respuesta con las cabeceras que le falten; las que ya trae no se tocan. Las
 * páginas HTML reciben las de _headers y el resto, la base estricta. Es una copia: las
 * respuestas de `fetch` (y de `env.ASSETS`) tienen las cabeceras inmutables.
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  const esPagina = (headers.get('content-type') ?? '').startsWith('text/html');
  for (const [name, value] of Object.entries(esPagina ? PAGE_SECURITY_HEADERS : SERVER_SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
