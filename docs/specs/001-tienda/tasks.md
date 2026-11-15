# Tareas 001 — Tienda de Don Pascal

> Una tarea a la vez. Marca `[x]` al terminar, ejecuta `npm test` y haz commit convencional.
> Es la tarea T28 del portafolio [A]nkordev. Objetivo: terminar a principios de la semana del 16 de noviembre de 2026; el portafolio se lanza el 21.
> Si no da tiempo, se recorta primero la Fase 4 (WhatsApp). Tests, seguridad y topes de gasto no se recortan.

## Fase 0 — Definición

- [x] E00 Carpeta propia, constitución (copia), `CLAUDE.md`, `PRODUCT.md`, spec, plan y tareas; dirección visual con impeccable; prompt de Don Pascal — *aprobada 2026-11-14: marca ficticia «Don Pascal», dirección «estándar de la categoría» según los Dribbble del usuario (contrato en `.impeccable/surfaces/`), ilustraciones de Don Pascal generadas con IA por el usuario, tope del asistente en 30 respuestas al día*

**Hecho cuando:** el usuario aprueba la spec, el plan y la dirección, y tiene la ilustración de Don Pascal.

## Fase 1 — Base

- [x] E01 Proyecto Astro + Cloudflare + Tailwind + TypeScript estricto con las dependencias del plan §2; `wrangler.jsonc`, `_headers`, middleware y cabeceras del servidor; Vitest, Playwright y `npm test`; CI — *base copiada del portafolio (cabeceras, middleware, tests de dependencias y de `wrangler.jsonc`, CI y Dependabot); `wrangler` 4.156.1 para alinearlo con el plugin del adaptador; sin URL de vista previa; e2e en el puerto 4349; las ilustraciones pasan a `src/assets/don-pascal/`*
- [x] E02 Tokens de la dirección en `global.css` + test de contraste; fuentes; `Base.astro` — *14 roles de color con 17 pares de texto en AA, bordes de control y anillos de foco a 3:1 y ningún hex fuera de `:root`; Poppins 300/400/600/700 desde el sitio; selección, cursor, foco y barra de desplazamiento con la paleta; favicon e icono de Apple recortados de la ilustración*
- [x] E03 `supabase/tienda.sql` y `catalogo-ejemplo.sql` (unos 30 productos genéricos con fotos libres y créditos); RLS verificada con la API; `keepalive` — *hecha 2026-11-14: proyecto propio `don-pascal` (Free, us-east-1), sin repo de GitHub conectado; creado con la Data API activa, sin exponer las tablas nuevas solas y sin RLS automática (no existe `rls_auto_enable`). Los tres SQL se ejecutaron una vez en el SQL Editor: 4 tablas con RLS, 6 categorías, 33 productos y 4 ajustes. `scripts/verificar-rls.sh` comprueba por la API con la clave publicable, sin escribir datos, que anon lee el catálogo y nada más, que en `chat_uso` solo inserta el canal y que solo llama a `ping()` y `chat_count_24h()`: 13 de 13. Lo que devuelve Supabase es idéntico al catálogo de ejemplo local, y con una URL falsa la tienda muestra el aviso de error en vez de los datos locales. Security Advisor: solo las 2 alertas intencionales (la política de `chat_uso` y `chat_count_24h`). En local, la URL y la clave van en `.dev.vars` (fuera de git). El secreto del keep-alive pasa a llamarse `SUPABASE_PUBLISHABLE_KEY`, como en la app; los secretos de GitHub y del Worker se ponen al publicar el repo y desplegar*

**Hecho cuando:** `npm test` en verde y el catálogo se lee desde Supabase.

## Fase 2 — Tienda

- [x] E04 `precios.ts` y `catalogo.ts` + tests unitarios (primero los tests) — *adelantada a petición del usuario (2026-11-14) con el catálogo de ejemplo en local mientras se crea Supabase. Precios en centavos enteros (oferta, mayor y Bs en una sola fórmula, formato es-VE); catálogo con caché de un minuto, validación de cada fila y error si Supabase falla; búsqueda sin tildes ni plurales. 33 fotos de producto generadas por el usuario con Nano Banana y recortadas, con su procedencia incrustada*
- [x] E05 Inicio según la dirección: cabecera, hero con Don Pascal y buscador, ofertas, categorías, los más pedidos, al mayor, cómo pedir, visítanos y pie; revisión temprana con capturas (design-taste-frontend, solo su revisión) — *hecha 2026-11-14. «Los más pedidos» pasa a «Recomendados de Don Pascal» (no hay datos de ventas: sería una cifra inventada). Las páginas se generan en el Worker, así que el middleware les pone las cabeceras de `_headers` (un test vigila que coincidan) y `wrangler.jsonc` deja de usar `not_found_handling` (con él, las navegaciones no llegaban al Worker). El adaptador no optimiza imágenes en esas páginas: `scripts/imagenes.sh` prepara las WebP en `public/img/`. Revisión de Taste (2 rondas): se aplicaron el «a tasa de ejemplo» repetido en cada precio (ahora una vez en el hero y en el pie), la tabla al mayor en el móvil, las insignias sobre la cara de Don Pascal, el texto corrido en tinta plena y la escala de tamaños; se descartaron por chocar con la dirección o con PRODUCT.md las sombras en reposo, el vídeo de stock y la separación de 120 px o más entre secciones; el titular de tres líneas se mantiene como en la referencia; «covered-text» y «eyebrow» eran falsos positivos (el enlace que cubre la tarjeta y dos tarjetas contiguas); el movimiento es E14. Textos revisados el mismo día tras analizar tiendas de Venezuela (Gama, Kromi, Yummy, Locatel) y de fuera (Mercadona, Chedraui, Jumbo, Instacart, Ocado): titular «Repostería y víveres / al mayor y al detal», tasa de ejemplo cercana a la real (Bs 911,62), IVA incluido, «Mínimo» y «c/u» en la tabla al mayor, delivery explícito en «Cómo pedir» y Don Pascal presentado como asistente virtual*
- [x] E06 Catálogo con búsqueda y categorías (formulario GET) y ficha de producto — *hecha 2026-11-14: filtros por URL validados (`filtros.ts`: texto de 60 caracteres como máximo, categoría solo si existe, «solo al mayor»), estado vacío con salidas, ficha con precio en $ y Bs, al mayor, disponibilidad, migas y relacionados, 404 con buscador. Textos con la skill copywriting. «Al mayor» solo se ofrece si ahorra de verdad (`ahorroMayor`): el fondant de ejemplo tenía el mayor por encima de su precio de oferta y se corrigió. e2e 2 y 4 en `catalogo.spec.ts`, también sin JS*
- [x] E07 Carrito y mensaje de WhatsApp + tests unitarios; e2e 1–4 y 7 + axe — *hecha 2026-11-14: `<dialog>` nativo (foco, Esc, fondo que cierra), cantidades de 1 a 99 con el precio al mayor automático desde el mínimo y la pista «Desde N: $ X c/u», total en $ y Bs, mensaje de WhatsApp con la tasa y la fecha; sin número configurado pasa a «Copiar pedido» con el mensaje plegado. localStorage validado (`normalizar`) y precios siempre recalculados con el catálogo, que viaja en un bloque JSON. axe sin violaciones serias en todas las páginas y con el carrito abierto (se corrigieron la `<dl>` de Visítanos y el nombre accesible del botón del carrito)*

**Hecho cuando:** se compra de punta a punta desde el móvil, también sin JS. *Cerrada y revisada por el usuario el 2026-11-14 con el catálogo de ejemplo (adelantada a la Fase 1, que espera a Supabase en E03). Queda por comprobar el pedido sin JS por el botón «Pedir» de cada producto, que solo aparece con `PUBLIC_STORE_WHATSAPP`: se verifica al configurar el número (Fase 4).*

## Fase 3 — Asistente

- [x] E08 `price-guard.ts` + tests unitarios (primero los tests) — *hecha 2026-11-14: `cifrasNoConfirmadas(respuesta, resultados)` devuelve las cifras de la respuesta que no salieron de las herramientas de esa petición (36 tests). Revisa cifras con moneda, porcentajes y decimales en cualquier formato (es-VE, en, NBSP, markdown, ancho completo); los enteros sueltos no. Más estricta que el plan original, que se actualiza: cada cifra se compara **con su moneda** (así «$ 10» no pasa por ser un mínimo al mayor), los porcentajes también se revisan (un descuento inventado se bloquea) y se bloquean las cifras con moneda mal formadas o con dígitos de otros alfabetos. Contrato para E09: las herramientas devuelven precios, totales, tasa y ofertas ya formateados con su moneda, y las instrucciones piden volver a consultarlas en cada respuesta. La sustitución por la respuesta segura y el log `guard-blocked` van en E10. Límite conocido: no detecta cifras escritas en letras (lo cubren las instrucciones y la batería de E12)*
- [x] E09 Herramientas, instrucciones y bucle con Claude (`claude.ts`) + tests con Claude simulado — *hecha 2026-11-14: `@anthropic-ai/sdk` 1.3.0 fijada (aprobada por el usuario: la más reciente con dos semanas, procedencia SLSA, sin scripts de instalación ni avisos de seguridad). Cuatro herramientas estrictas de solo lectura que reutilizan `precios.ts`, `buscarProductos` y `resumir` del carrito, con los precios formateados con su moneda (37 tests, uno comprueba que repetir cualquier dato suyo pasa `price-guard`); validan la entrada en el código porque el modo estricto no admite mínimos ni máximos. Instrucciones en positivo y con el motivo, sin datos que cambien. `responder()` hace como mucho 4 vueltas, devuelve el turno del asistente tal cual (pensamiento incluido) y todos los resultados en un mensaje, mira `stop_reason` antes de leer y aplica `price-guard` a las cifras de esa petición (17 tests con Claude simulado). Petición: Opus 5.5, esfuerzo bajo, 4000 tokens, sin streaming, `fallbacks: "default"`, caché de instrucciones y herramientas y caché automática entre vueltas. Ninguna llamada real todavía: eso es E12*
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
