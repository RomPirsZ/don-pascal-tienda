# Producto — Don Pascal

## Qué es

**Don Pascal** es un mercado y repostería **ficticio** de Guanare (Portuguesa, Venezuela). Empezó como proveedor de repostería y hoy es un abasto completo: repostería, panadería, víveres, charcutería y bebidas, **al mayor y al detal**.

Su tienda online es el proyecto 002 del portafolio de [A]nkordev (tarea T28). Demuestra cómo se resuelve la tienda de un comercio local venezolano:
- catálogo rápido en el móvil, con precios en $ y en Bs a la tasa BCV;
- carrito que termina en un pedido por WhatsApp, como se compra hoy en la ciudad;
- un asistente con IA que atiende en la web y en WhatsApp y **nunca inventa productos ni precios**.

El modelo de negocio se inspira en los comercios locales de Guanare que crecieron desde la repostería. La marca, el personaje y los textos son propios, y no representan a ningún comercio real.

## Públicos

- **Cliente de la tienda, dentro de la ficción** (el público simulado), casi siempre desde el móvil. Puede ser:
  - una familia de Guanare que hace la compra de la semana y quiere ver qué hay, cuánto cuesta en $ y en Bs y pedirlo sin ir;
  - un emprendedor (repostero, panadero, pizzero) que compra al mayor y quiere saber presentaciones, precios y cómo pedir volumen.
- **Quien evalúa a [A]nkordev** (el público real):
  - un dueño de negocio local, que tiene que pensar «quiero esto para mi negocio»;
  - un cliente internacional, que valora las decisiones técnicas, sobre todo un asistente con IA con garantías reales contra las respuestas inventadas.

## Marca y voz

- **Don Pascal** es a la vez el nombre de la tienda y su mascota: un comerciante llanero, humano y animado, en el hero, en el chat y en las piezas de ofertas. Su diseño es propio y no se parece a la mascota de ningún comercio real.
- **Voz:** cercana, cálida y directa, de tú, con giros venezolanos sin caricatura. Frases cortas. Primero lo que el cliente necesita (qué hay, cuánto cuesta y cómo pedir) y después el cariño.
- **Ambiente** (decidido 2026-11-14): el estándar de una tienda de comida en línea moderna, ejecutado a fondo, con la vara de las dos referencias de Dribbble (spec §2). Verde profundo y amarillo, fotos de producto recortadas y grandes, titulares en dos pesos y botones en píldora. El contrato está en `.impeccable/surfaces/src-pages-index-astro.md`.

## Límites y honestidad

- **Aviso de concepto visible:** el sitio dice que Don Pascal es una tienda ficticia, concepto de [A]nkordev, y que no tiene relación con ningún comercio real.
- **Catálogo ficticio:** productos genéricos, sin marcas reales. Los precios son ficticios y se rotulan; la tasa BCV también es de ejemplo.
- **Nada inventado como prueba social:** sin reseñas, valoraciones, estrellas, «clientes felices», cifras, premios ni prensa, ni siquiera dentro de la ficción.
- **Sin urgencia falsa:** hay ofertas, pero sin cuentas atrás ni «quedan 2».
- **El asistente no inventa:** solo dice productos, presentaciones y precios que estén en la base de datos. Si algo no existe, lo dice y ofrece hablar con la tienda. Nunca da descuentos ni promete entregas.
- **Fotos:** las de producto son libres y llevan créditos. Don Pascal es una ilustración generada con IA y se acredita como tal.

## Datos y privacidad (constitución X)

- No hay cuentas ni pagos, y no se guardan datos personales en la base de datos.
- El chat de la web guarda la conversación solo en el navegador (`sessionStorage`).
- En WhatsApp, el historial por número se guarda 24 horas y después se borra solo.
- El chat avisa de que responde un asistente con IA (Claude, de Anthropic) y de que no hace falta dar datos personales.
