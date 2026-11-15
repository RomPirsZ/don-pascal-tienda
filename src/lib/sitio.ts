// Datos del sitio que no son textos de interfaz (E17, spec §9: el enlace se ve bien al
// compartirlo). Sin dominio propio todavía; el día que lo haya, se cambia solo aquí.
export const SITE_URL = 'https://don-pascal.ankordev.workers.dev';

/** Imagen para compartir (Open Graph y X): 1200 × 630, servida desde public/og/. */
export const IMAGEN_OG = { ruta: '/og/don-pascal.jpg', ancho: 1200, alto: 630, tipo: 'image/jpeg' } as const;

/** Lo que muestran WhatsApp, Google y compañía: más largo se corta. */
export const LARGO_DESCRIPCION = 160;
