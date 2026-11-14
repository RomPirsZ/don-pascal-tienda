# Spec 001 — Tienda de Don Pascal (mercado y repostería ficticio)

> Qué se construye y por qué. Los detalles técnicos están en `plan.md`. Rige `docs/constitution.md`.
> Proyecto 002 del portafolio [A]nkordev (spec 001 §8 del portafolio, tarea T28).
> Estado: **borrador** (2026-11-14), pendiente de aprobación junto con la dirección visual (E00).

---

## 1. Objetivo

La tienda online de **Don Pascal**, un mercado y repostería **ficticio** de Guanare que vende al mayor y al detal. Se puede:
- ver el catálogo con precios en $ y en Bs;
- armar un carrito y enviar el pedido por WhatsApp;
- preguntarle al asistente con IA, en la web o en WhatsApp, qué hay, cuánto cuesta y cómo pedir.

Es una pieza de portafolio: tiene que funcionar de verdad para el cliente de la tienda (el público simulado), porque así convence a quien evalúa a [A]nkordev (el público real). Ver `PRODUCT.md`.

**Éxito:**
- Desde el teléfono, en menos de 10 segundos se encuentra un producto, se ve su precio en $ y en Bs y se sabe cómo pedirlo.
- El asistente responde con datos reales del catálogo y nunca da un producto o un precio que no esté en la base de datos.

## 2. Referencias (principios, no copia)

| Referencia | Qué tomamos | Qué no tomamos |
|---|---|---|
| Dribbble, «Food Ordering Website» (DelishDrop; captura aportada por el usuario el 2026-11-14) | Hero en verde oscuro con titular blanco grande y botón amarillo en píldora. Producto recortado con insignias flotantes. Rejilla de banners de promoción en amarillo, naranja y verde con el descuento grande. Tarjetas de producto. Categorías como fichas alrededor de una imagen central. Lista de ofertas. | Estrellas, valoraciones y «clientes satisfechos». La cuenta atrás de las ofertas. Su nombre, sus textos y sus fotos. |
| Dribbble, «Grocery shop Website UI» (captura aportada por el usuario el 2026-11-14) | Titular en dos pesos (negrita y ligera). Buscador con selector de categoría y botón amarillo. Figura protagonista a la derecha, con insignias flotantes («100 % fresco», ubicación). Fondo verde profundo con un arco suave detrás de la figura. | La persona (aquí va Don Pascal). «Our Happy Customer» y su nota. Las insignias de las tiendas de apps. El registro. |
| Comercios locales de Guanare que crecieron desde la repostería (contexto aportado por el usuario) | El modelo de negocio: mayor y detal, repostería y víveres, horario extendido, precio en $ con la tasa BCV, voz cercana y orgullo local, mascota humana animada en las piezas de producto. | El nombre, el logo, la mascota, los colores exactos, las fotos y las piezas de cualquier comercio real. |

## 3. Historias de usuario

1. **Como cliente con el móvil**, quiero buscar un producto y ver su precio en $ y en Bs, para saber cuánto voy a gastar.
2. **Como cliente**, quiero armar un carrito y enviarlo por WhatsApp con un toque, para pedir sin escribir la lista a mano.
3. **Como emprendedor que compra al mayor**, quiero ver las presentaciones y saber cómo se pide al mayor, para abastecer mi negocio.
4. **Como cliente con una duda**, quiero preguntarle al asistente en la web o por WhatsApp («¿tienen harina de trigo?», «¿cuánto me salen 3 kilos de azúcar?»), y que me responda con lo que de verdad hay.
5. **Como cliente**, quiero saber el horario y dónde está la tienda sin buscar.
6. **Como dueño de un negocio que evalúa a [A]nkordev**, quiero ver una tienda local que se sienta cuidada, rápida y fiable, y saber que es un concepto.
7. **Como visitante sin JavaScript o con movimiento reducido**, quiero ver el catálogo y poder pedir igual.

## 4. Páginas (en español)

- **Inicio** (secciones en §5).
- **Catálogo** (`/productos/`): todos los productos, con búsqueda por texto y filtro por categoría. La búsqueda y el filtro funcionan sin JS (formulario GET).
- **Ficha de producto** (`/productos/[slug]/`): foto, nombre, presentación, precio en $ y Bs, disponibilidad, «Añadir al carrito» y «Pedir por WhatsApp».
- **Carrito:** un panel lateral accesible desde la cabecera, con cantidades, total en $ y Bs y el botón «Enviar pedido por WhatsApp».
- **404.**

## 5. Secciones del inicio (en orden; se ajusta con la dirección en E00)

1. **Cabecera:** logotipo de Don Pascal, enlaces (Productos, Ofertas, Al mayor, Cómo pedir), carrito con contador. En el móvil, menú accesible.
2. **Hero:**
   - titular en dos pesos y una línea de apoyo;
   - buscador con selector de categoría y botón amarillo;
   - **Don Pascal** a la derecha, con insignias flotantes (horario, «al mayor y al detal», Guanare);
   - el aviso de concepto, discreto pero visible sin hacer scroll.
3. **Ofertas:** rejilla de banners de color con el producto recortado, el descuento y «Añadir». Las ofertas son ficticias como el resto del catálogo, y no hay cuentas atrás.
4. **Categorías:** repostería, panadería, víveres, charcutería, bebidas y limpieza, como fichas que llevan al catálogo filtrado.
5. **Los más pedidos:** tarjetas de producto con precio en $ y Bs y «Añadir».
6. **Al mayor:** bloque para emprendedores (reposteros, panaderos, pizzerías) con las presentaciones grandes y cómo pedir volumen.
7. **Cómo pedir:** 3 pasos: arma tu carrito → envíalo por WhatsApp → retira en la tienda o coordina la entrega.
8. **Pregúntale a Don Pascal:** presenta el asistente (web y WhatsApp) con ejemplos de preguntas.
9. **Visítanos:** horario y dirección ficticios, solo en texto, sin mapa embebido.
10. **Pie:** «Concepto de [A]nkordev — Don Pascal es una tienda ficticia», créditos de las fotos y de la ilustración, tasa de ejemplo y año.

## 6. Asistente «Pregúntale a Don Pascal»

- **Dónde:** un botón flotante abre el chat en la web; en WhatsApp responde al número de prueba de Meta (plan §7).
- **Qué hace:** busca productos, da presentaciones, precios en $ y Bs y disponibilidad, calcula totales de una lista, explica horario, mayor y detal y cómo pedir.
- **Qué no hace nunca:**
  - dar un producto, una presentación o un precio que no venga de la base de datos;
  - hacer descuentos, prometer entregas o plazos;
  - hablar de otros temas: responde que solo atiende sobre la tienda.
- **Si algo no está en el catálogo**, lo dice claramente y ofrece escribir a la tienda por WhatsApp.
- **Transparencia:** el chat dice que responde un asistente con IA y que no hace falta dar datos personales.
- **Sin JS:** en lugar del chat se muestra el enlace a WhatsApp.
- **Topes:** hay un número máximo de respuestas al día. Al llegar al tope, el chat lo dice con amabilidad y remite a WhatsApp.

## 7. Identidad visual

Decidida el 2026-11-14 con impeccable. El usuario eligió **el estándar de la categoría, como en las referencias de §2**, en lugar de la dirección alternativa «El mostrador». El contrato completo está en `.impeccable/surfaces/src-pages-index-astro.md`:
- hero y pie en verde profundo, amarillo maíz para la acción principal, verde hoja (el del delantal) en acentos, una banda verde claro en categorías y naranja ají solo en las ofertas;
- Poppins: titulares en dos pesos (700 y 300) y texto en 400;
- tarjetas con esquinas redondeadas y sombra suave, botones e insignias en píldora;
- fotos de producto recortadas y grandes;
- Don Pascal como protagonista del hero y avatar del chat.

**Don Pascal:** un comerciante llanero de unos 60 años, de piel morena, con bigote canoso, sombrero llanero de cogollo, camisa blanca y delantal verde con ribete amarillo. Sin barba ni lentes. Render 3D estilizado que genera el usuario con IA; el prompt queda en el plan §9.

## 8. Movimiento

- Entradas suaves de las secciones al hacer scroll; las tarjetas, escalonadas.
- Don Pascal entra con un pequeño saludo al cargar.
- Insignias flotantes con un vaivén muy leve (solo escritorio y sin reduced-motion).
- El carrito y el chat se abren deslizándose.
- Con reduced-motion no hay animaciones.

## 9. Requisitos no funcionales

Los de la constitución (accesibilidad, rendimiento, seguridad, testing, privacidad), más:
- El asistente no puede ser usado para gastar sin límite: tope diario de respuestas, límite por IP y Turnstile.
- Los precios en Bs se calculan siempre con la tasa guardada en la base de datos, nunca a mano.
- El enlace se ve bien al compartirlo en WhatsApp (imagen y descripción).

## 10. Criterios de aceptación

- [ ] El aviso de concepto se ve sin hacer scroll, y los precios ficticios están rotulados.
- [ ] Desde el móvil, buscar un producto, añadirlo y enviar el pedido por WhatsApp lleva menos de 30 segundos.
- [ ] El mensaje de WhatsApp lleva cada producto con cantidad y precio y el total en $ y Bs, con la tasa del día.
- [ ] Sin JS se ve todo el catálogo, se busca y se filtra, y cada producto se puede pedir por WhatsApp.
- [ ] Ante productos inexistentes, peticiones de descuento e instrucciones inyectadas, el asistente no da ningún producto ni precio fuera de la base de datos (batería de E11).
- [ ] WhatsApp: un mensaje desde un teléfono verificado recibe una respuesta con datos del catálogo (si la Fase 4 no se recorta).
- [ ] Con movimiento reducido no hay animaciones.
- [ ] Lighthouse móvil con los umbrales de la constitución y axe sin violaciones serias.

## 11. Fuera de alcance

Cuentas de usuario, pagos en línea, envíos con seguimiento, panel de administración, inventario en tiempo real, cupones, versión en inglés y número de WhatsApp de producción.
