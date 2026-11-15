// Tipos mínimos del runtime de Workers, como en el portafolio: se declaran aquí en vez de
// instalar @cloudflare/workers-types (constitución VII).
/** Variables públicas de build (`.env` en local, Workers Builds en producción). */
interface ImportMetaEnv {
  /** Número de WhatsApp de la tienda, solo dígitos con código de país (plan §5). Vacío: modo «Copiar». */
  readonly PUBLIC_STORE_WHATSAPP?: string;
  /** Clave de sitio de Turnstile (pública). Vacía: la de prueba de Cloudflare, que el servidor rechaza en producción. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

declare module 'cloudflare:workers' {
  /** Variables y secretos del Worker (`.dev.vars` en local, panel de Cloudflare en producción). */
  export const env: Record<string, unknown>;
}
