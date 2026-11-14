# Tareas 001 — Tienda de Don Pascal

> Una tarea a la vez. Marca `[x]` al terminar, ejecuta `npm test` y haz commit convencional.
> Es la tarea T28 del portafolio [A]nkordev. Objetivo: terminar a principios de la semana del 16 de noviembre de 2026; el portafolio se lanza el 21.
> Si no da tiempo, se recorta primero la Fase 4 (WhatsApp). Tests, seguridad y topes de gasto no se recortan.

## Fase 0 — Definición

- [x] E00 Carpeta propia, constitución (copia), `CLAUDE.md`, `PRODUCT.md`, spec, plan y tareas; dirección visual con impeccable; prompt de Don Pascal — *aprobada 2026-11-14: marca ficticia «Don Pascal», dirección «estándar de la categoría» según los Dribbble del usuario (contrato en `.impeccable/surfaces/`), ilustraciones de Don Pascal generadas con IA por el usuario, tope del asistente en 30 respuestas al día*

**Hecho cuando:** el usuario aprueba la spec, el plan y la dirección, y tiene la ilustración de Don Pascal.

## Fase 1 — Base

- [x] E01 Proyecto Astro + Cloudflare + Tailwind + TypeScript estricto con las dependencias del plan §2; `wrangler.jsonc`, `_headers`, middleware y cabeceras del servidor; Vitest, Playwright y `npm test`; CI — *base copiada del portafolio (cabeceras, middleware, tests de dependencias y de `wrangler.jsonc`, CI y Dependabot); `wrangler` 4.156.1 para alinearlo con el plugin del adaptador; sin URL de vista previa; e2e en el puerto 4349; las ilustraciones pasan a `src/assets/don-pascal/`*
- [ ] E02 Tokens de la dirección en `global.css` + test de contraste; fuentes; `Base.astro`
- [ ] E03 `supabase/tienda.sql` y `catalogo-ejemplo.sql` (unos 30 productos genéricos con fotos libres y créditos); RLS verificada con la API; `keepalive`

**Hecho cuando:** `npm test` en verde y el catálogo se lee desde Supabase.

## Fase 2 — Tienda

- [ ] E04 `precios.ts` y `catalogo.ts` + tests unitarios (primero los tests)
- [ ] E05 Inicio según la dirección: cabecera, hero con Don Pascal y buscador, ofertas, categorías, los más pedidos, al mayor, cómo pedir, visítanos y pie; revisión temprana con capturas (design-taste-frontend, solo su revisión)
- [ ] E06 Catálogo con búsqueda y categorías (formulario GET) y ficha de producto
- [ ] E07 Carrito y mensaje de WhatsApp + tests unitarios; e2e 1–4 y 7 + axe

**Hecho cuando:** se compra de punta a punta desde el móvil, también sin JS.

## Fase 3 — Asistente

- [ ] E08 `price-guard.ts` + tests unitarios (primero los tests)
- [ ] E09 Herramientas, instrucciones y bucle con Claude (`claude.ts`) + tests con Claude simulado
- [ ] E10 `/api/chat`: Turnstile, límite por IP, tope diario (`chat_uso`), errores + tests de integración; e2e de las cabeceras del servidor (`src/middleware.ts`)
- [ ] E11 Widget de chat accesible (diálogo, `aria-live`, teclado, aviso de IA, sin JS → WhatsApp); e2e 5
- [ ] E12 Batería de preguntas trampa contra la API real, con el coste aprobado antes; ajustes de las instrucciones si hace falta

**Hecho cuando:** la batería de E12 pasa sin ninguna cifra ni producto inventado.

## Fase 4 — WhatsApp (recortable)

- [ ] E13 `/api/whatsapp`: reto, firma, historial en KV y respuesta por la Graph API + tests; despliegue en Workers; configuración guiada en Meta con el número de prueba

**Hecho cuando:** un mensaje real desde un teléfono verificado recibe una respuesta con datos del catálogo.

## Fase 5 — Cierre

- [ ] E14 Movimiento y reduced-motion (e2e 6); afinado con transitions-polish
- [ ] E15 Revisión visual a 375, 768 y 1440 px, revisión final de impeccable y `DESIGN.md`
- [ ] E16 Lighthouse móvil con los umbrales de la constitución; despliegue final y checklist de seguridad (cabeceras, RLS, secretos, topes)

**Al terminar cada fase:** parar y esperar revisión.
