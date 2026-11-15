---
name: Don Pascal
description: Mercado y repostería de Guanare, al mayor y al detal, con el oficio de un e-commerce de comida moderno.
colors:
  monte: "#1e4d3a"
  monte-claro: "#2c6a50"
  hoja: "#5baa3c"
  hoja-texto: "#2e7a2e"
  pradera: "#dcefd0"
  maiz: "#ffc93c"
  aji: "#f26b3a"
  aji-texto: "#b8401a"
  tinta: "#14251c"
  tinta-suave: "#4a5d52"
  papel: "#ffffff"
  superficie: "#f4f7f2"
  sobre-monte-suave: "#c9ddd1"
  linea: "#d5dfd6"
typography:
  display:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, min(1.41rem + 3.43vw, 9.9vw - 0.2rem), 4.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  display-ligero:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, min(1.41rem + 3.43vw, 9.9vw - 0.2rem), 4.5rem)"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.38rem + 1.52vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.11rem + 0.57vw, 1.625rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.98rem + 0.1vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
  mini:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
  precio:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.03rem + 0.38vw, 1.375rem)"
    fontWeight: 700
    lineHeight: 1.25
    fontFeature: "tnum"
rounded:
  tarjeta: "20px"
  control: "14px"
  pildora: "9999px"
spacing:
  contenedor-movil: "16px"
  contenedor: "40px"
  contenedor-max: "1280px"
  seccion: "64px"
  seccion-lg: "80px"
  rejilla: "12px"
  rejilla-amplia: "16px"
components:
  boton-principal:
    backgroundColor: "{colors.maiz}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.pildora}"
    padding: "12px 24px"
  boton-secundario:
    backgroundColor: "{colors.monte}"
    textColor: "{colors.papel}"
    rounded: "{rounded.pildora}"
    padding: "12px 24px"
  boton-anadir:
    backgroundColor: "{colors.maiz}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pildora}"
    size: "44px"
  chip-descuento:
    backgroundColor: "{colors.aji}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.pildora}"
    padding: "2px 10px"
  chip-sugerencia:
    backgroundColor: "{colors.pradera}"
    textColor: "{colors.monte}"
    rounded: "{rounded.pildora}"
    padding: "8px 16px"
  chip-sugerencia-hover:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
  tarjeta-producto:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.tarjeta}"
    padding: "12px"
  banner-oferta-maiz:
    backgroundColor: "{colors.maiz}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.tarjeta}"
    padding: "24px"
  banner-oferta-aji:
    backgroundColor: "{colors.aji}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.tarjeta}"
    padding: "24px"
  banner-oferta-hoja:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.tarjeta}"
    padding: "24px"
  banner-oferta-pradera:
    backgroundColor: "{colors.pradera}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.tarjeta}"
    padding: "24px"
  campo:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pildora}"
    padding: "10px 16px"
  insignia-flotante:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.pildora}"
    padding: "8px 16px 8px 8px"
---

# Design System: Don Pascal

## Overview

**Creative North Star: "La tienda de barrio con oficio"**

Don Pascal es el abasto de la esquina hecho con el acabado de un e-commerce de comida moderno. El sistema no ironiza ni inventa una categoría nueva: ejecuta a fondo el canon de la tienda de comida en línea (verde profundo, amarillo de acción, tarjetas redondeadas con sombra suave, botones en píldora, insignias blancas flotantes) y pone lo propio en los datos y en el personaje. El precio en $ y en Bs, el «al mayor» y Don Pascal, el comerciante llanero ilustrado, son lo que lo distingue.

La densidad es la de un catálogo móvil a pleno sol: contraste alto, texto de cuerpo de 16-17 px, objetivos táctiles de 44 px o más, y nada por debajo de 13 px. El verde del monte enmarca la página (cabecera, hero, al mayor, pie y chat) y el blanco del papel lleva el catálogo. El color fuerte se reserva para la acción (maíz) y la oferta (ají y su rotación).

El movimiento es suave y sin rebote. Hay un solo momento propio, la llegada de Don Pascal en el hero. Todo lo demás explica estado: el contenido que llega, el panel que se abre, el contador que confirma. Con reduced-motion no se mueve nada.

**Key Characteristics:**
- Marco en verde monte, catálogo sobre papel blanco.
- Maíz para la acción principal, siempre con texto en tinta.
- Tarjetas de 20 px con sombra suave teñida de tinta; píldoras para botones, chips e insignias.
- Poppins en dos pesos para el titular (700 y 300) y 400 para el texto.
- Precio en $ y en Bs, con cifras tabulares y un importe que nunca se parte.
- Don Pascal sobre un arco: en el hero, en la 404 y en el chat.

## Colors

Una paleta de mercado: verde de monte y de hoja, amarillo de maíz y naranja de ají, sobre blanco y una superficie apenas verde.

### Primary
- **Verde monte** (`monte`): el marco de la página. Fondo de la cabecera, el hero, la franja de al mayor, el pie, la cabecera del chat y el botón secundario. Encima solo va papel, sobre-monte-suave o maíz.
- **Amarillo maíz** (`maiz`): la acción principal (Buscar, Añadir, Ver productos, Enviar por WhatsApp), el fondo de la selección de texto, el foco sobre el monte y el primer banner de oferta. Siempre con texto en tinta.

### Secondary
- **Verde hoja** (`hoja`): el verde del delantal. Relleno con texto en tinta (tercer banner de oferta, hover de las sugerencias del chat, fondo del avatar). Nunca es texto sobre papel.
- **Verde hoja como texto** (`hoja-texto`): la versión legible del verde sobre papel o superficie: enlaces de texto, migas, estados del carrito, el cursor de escritura.
- **Verde pradera** (`pradera`): la banda de categorías, el cuarto banner de oferta, el bloque de al mayor en la ficha, los círculos de los pasos, las sugerencias del chat, la segunda línea del titular del hero (sobre el monte) y el arco de Don Pascal en la 404.
- **Monte claro** (`monte-claro`): superficies sobre el monte. El arco detrás de Don Pascal en el hero, el fondo del avatar y el botón de menú. Encima, solo papel.

### Tertiary
- **Naranja ají** (`aji`): la oferta. Segundo banner de oferta y el chip de descuento («-15 %») en tarjetas de producto y en la foto de la ficha. Siempre con texto en tinta.
- **Ají como texto** (`aji-texto`): el descuento o el aviso escrito sobre papel (productos omitidos del carrito).

### Neutral
- **Tinta** (`tinta`): texto principal, el contador del carrito y el tinte de las sombras y del fondo de los diálogos (50 %).
- **Tinta suave** (`tinta-suave`): texto secundario (presentación, precio en Bs, avisos) y el borde de los controles. Es el único borde de un control.
- **Papel** (`papel`): el suelo de la página, las tarjetas, los campos y las insignias flotantes.
- **Superficie** (`superficie`): secciones alternas, el fondo de la foto en la tarjeta, el pie del carrito, el cuerpo del chat y el hover de filas y botones fantasma.
- **Texto suave sobre el monte** (`sobre-monte-suave`): texto secundario sobre el monte. No sobre el monte claro.
- **Línea** (`linea`): divisores decorativos (filas del carrito, cabecera y pie del panel). Nunca el borde de un control.

### Named Rules
**La Regla de los Roles.** Los colores existen solo como custom properties en `:root` de `src/styles/global.css` y como utilidades de `@theme inline`. Un componente usa el rol (`bg-maiz`, `text-tinta-suave`), nunca un hex. Los pares de texto y fondo los vigila `tests/unit/tokens.test.ts`.

**La Regla de la Tinta sobre Color.** Todo relleno de color vivo (maíz, ají, hoja, pradera) lleva texto en tinta. Nunca blanco sobre maíz, ají u hoja.

**La Regla de la Rotación de Ofertas.** Los banners de oferta rotan cuatro fondos en este orden: maíz, ají, hoja, pradera, y vuelven a empezar. Los cuatro llevan todo su texto en tinta (descuento, nombre, presentación y precio en $ y en Bs). El ají es el color de la oferta: fuera de los banners solo aparece como chip de descuento («-15 %») en la tarjeta de producto y en la foto de la ficha.

**La Regla del Verde Legible.** Hoja es relleno; hoja-texto es texto. Si un verde tiene que leerse sobre papel o superficie, es hoja-texto.

## Typography

**Display Font:** Poppins (con ui-sans-serif, system-ui, sans-serif)
**Body Font:** Poppins
**Pesos cargados:** 300, 400, 600 y 700 (latin, de `@fontsource/poppins`).

**Character:** Una sola familia geométrica y cálida, que gana contraste con el peso y no con una segunda fuente. El titular del hero se escribe en dos pesos: la primera línea en 700 y la segunda en 300, en pradera sobre el monte.

### Hierarchy
- **Display** (700 y 300, `--text-hero` de 28 a 72 px, 1.05, -0.03em): solo el titular del hero, en dos líneas de dos pesos. Desde lg usa `--text-hero-lg`, que encoge antes para compartir fila con Don Pascal. Por debajo de 390 px encoge con la pantalla para que la primera línea quepa entera.
- **Headline** (700, `--text-titulo` de 28 a 44 px, 1.12, -0.02em): títulos de sección (Ofertas, Categorías, Cómo pedir, Al mayor, Pregunta) y el nombre del producto en la ficha.
- **Title** (600 o 700, `--text-subtitulo` de 20 a 26 px): pasos de Cómo pedir, título del carrito, «Ver todo» en Recomendados y productos relacionados.
- **Body** (400, `--text-cuerpo` de 16 a 17 px, 1.6): texto corrido. Los párrafos largos se limitan a unas 34-40rem. Las frases de apoyo van en `text-lg` (18 px).
- **Label** (600, `--text-pequeno` 14 px): presentación del producto, precio en Bs, chips, insignias y avisos.
- **Mini** (700, `--text-mini` 13 px): contadores (carrito), números de los pasos y el bocadillo del hero en el móvil.
- **Precio** (700, `--text-precio` de 18 a 22 px, cifras tabulares): el precio grande de la ficha y el total del carrito. En las tarjetas el precio en $ va en `text-lg` 700.

### Named Rules
**La Regla del Suelo de 13 px.** `--text-mini` (13 px) es lo más pequeño que se lee. Nada va por debajo: ni contadores, ni notas legales, ni créditos.

**La Regla del Importe Entero.** Entre la moneda y la cifra va siempre un espacio duro («$ 1,30», «Bs 1.185,11»), y lo pone el formateador (`formatoUsd` y `formatoBs` en `src/lib/precios.ts`), no el componente ni la traducción. Un importe nunca se parte entre dos líneas, tampoco dentro de una frase que lo interpole.

**La Regla de las Cifras en Columna.** Toda cifra de precio, tasa o contador lleva la clase `precio` (`font-variant-numeric: tabular-nums`).

## Layout

El contenedor tiene un máximo de 80rem (1280 px) centrado, con 16 px de margen lateral en el móvil y 40 px desde md (768 px). Las secciones respiran con 64 px de padding vertical y 80 px desde lg (1024 px); las franjas a sangre (pradera, superficie, monte) alternan con secciones sobre papel.

Las rejillas de catálogo van de 2 columnas en el móvil a 3 (sm o md) y 4 desde lg, con huecos de 12 px y 16 px desde sm. Las categorías llegan a 6 columnas desde lg. Los banners de oferta son una rejilla de 1 columna que pasa a 2 desde sm (640 px).

El hero es una rejilla de dos columnas desde lg (8/13 para el texto, 5/13 para Don Pascal). En el móvil va primero el texto (titular, apoyo, buscador, enlace al chat, aviso de concepto) y debajo Don Pascal. La 404 usa la misma gramática a 7/11 y 4/11.

**La Regla de Don Pascal a la Cintura.** Por debajo de 640 px Don Pascal se recorta a la cintura: su caja tiene un alto fijo (16.5rem) con el resto oculto, y el dibujo se desplaza un poco a la derecha. El bocadillo pasa a dos líneas (6.5rem de ancho, 13 px) y pierde su icono.

**La Regla del Suelo de Don Pascal.** Don Pascal siempre está de pie sobre un arco (radio superior completo) que nace del borde inferior de su sección: el monte claro en el hero, la pradera en la 404, donde desde lg se apoya sobre el pie. Nunca flota cortado en mitad del blanco.

## Elevation & Depth

Es un sistema con sombra suave y difusa, siempre teñida de la tinta y con desplazamiento vertical negativo en el spread, nunca dura ni desplazada en diagonal. Hay dos niveles. Las superficies a sangre (monte, pradera, superficie) dan la profundidad tonal; la sombra separa lo que se toca.

### Shadow Vocabulary
- **Tarjeta** (`--shadow-tarjeta`: `0 10px 28px -14px` tinta al 30 %): tarjetas de producto y de categoría, fotos de los banners, burbujas del chat y ejemplos de pregunta, el botón Buscar sobre el monte.
- **Flotante** (`--shadow-flotante`: `0 14px 36px -12px` tinta al 40 %): lo que flota sobre otra cosa: el buscador, las insignias del hero, el botón del chat, el menú móvil, el panel del chat en escritorio, y el hover de las tarjetas.

### Named Rules
**La Regla del Hover que Sube.** Una tarjeta pasa de sombra de tarjeta a sombra flotante al hover (200 ms, curva suave), y su foto crece un 3 o 4 %. No hay otro levantamiento.

## Shapes

Formas blandas y amables. Tres radios: tarjeta (20 px) para tarjetas, banners, la ficha y los paneles; control (14 px) para fotos dentro de una tarjeta, filas del menú y bloques de texto preformateado; píldora para todo botón, campo, chip, insignia, contador y avatar. Las burbujas del chat son tarjetas con la esquina del lado de quien habla reducida (`rounded-bl-md` para Don Pascal, `rounded-br-md` para el cliente). El arco de Don Pascal es un medio punto completo arriba. No hay esquinas rectas en nada que se toque.

## Components

### Buttons
- **Shape:** píldora.
- **Principal:** maíz con texto en tinta, 600, 12 px × 24 px (10 px × 24 px en el buscador), con icono de 20 px a la izquierda. Es la acción de cada contexto: Buscar, Añadir al carrito, Ver productos, Ver al mayor, Volver a la tienda.
- **Secundario:** monte con texto en papel, mismas medidas. Para la acción alternativa por WhatsApp junto a la principal.
- **Añadir (icono):** círculo maíz de 44 px con el «+» en tinta; en el envío del chat, 48 px.
- **Pulsar:** `active:scale-95` en 150 ms. Sin cambio de color al hover en los rellenos.
- **Fantasma:** círculo de 44 px sin fondo que toma superficie al hover (monte claro sobre el monte), para cerrar paneles.
- **Enlace de acción:** texto 600 en hoja-texto (maíz sobre el monte) con icono, subrayado al hover.

### Chips
- **Descuento:** píldora ají, texto 700 en tinta, 14 px, arriba a la izquierda de la foto en la tarjeta (2 px × 10 px) y en la ficha (4 px × 12 px, 16 px).
- **Agotado:** píldora superficie con texto en tinta suave, ocupa el sitio del botón Añadir.
- **Sugerencia del chat:** píldora pradera con texto en monte; al hover, hoja con texto en tinta.

### Cards / Containers
- **Corner Style:** tarjeta (20 px); la foto interior, control (14 px).
- **Background:** papel; la foto descansa sobre superficie.
- **Shadow Strategy:** sombra de tarjeta en reposo y flotante al hover (ver Elevation & Depth).
- **Border:** ninguno.
- **Internal Padding:** 12 px, con el texto a 4 px más hacia dentro. El enlace del nombre cubre toda la tarjeta; Añadir queda por encima.

### Banners de oferta
Bloque de color a sangre de tarjeta (20 px de radio, 20 px de padding, 24 px desde sm) con la rotación maíz, ají, hoja, pradera. A la izquierda el descuento enorme (36 px, 48 px desde sm, 700), el nombre, la presentación y el precio, todo en tinta. A la derecha, el producto recortado, sin fondo, al 38 % del ancho (máximo 12rem): flota sobre el color con una sombra que sigue su silueta, teñida de tinta (`.sombra-recorte`), y al hover gira -2° y crece un 3 %. Si un producto aún no tiene recorte, se usa su foto de estudio con radio de control y sombra de tarjeta. Sin cuentas atrás ni existencias.

### Inputs / Fields
- **Style:** píldora papel con borde de 1 px en tinta suave, 10 px × 16 px, placeholder en tinta suave.
- **Buscador:** en el móvil es una tarjeta papel apilada (selector, campo, botón); desde sm, una sola píldora con sombra flotante donde el selector y el campo pierden el borde y solo queda un divisor entre ellos.
- **Focus:** contorno de 3 px en monte con 3 px de separación; sobre el monte (`.sobre-monte`), en maíz.

### Navigation
Cabecera de 72 px en monte con texto en papel: avatar de Don Pascal y nombre (20 px, 700) a la izquierda, enlaces 600 en el centro desde lg con subrayado maíz de 2 px al hover, y el carrito en píldora maíz con el contador en píldora tinta (13 px, 700, cifras tabulares) a la derecha. Por debajo de lg, un botón de menú circular en monte claro abre una tarjeta papel flotante con filas de radio control.

### Insignias del hero
Píldoras papel con sombra flotante, texto 600 de 14 px en tinta y un círculo de icono de 32 px (maíz para el horario, hoja para WhatsApp). El bocadillo lleva un pico de 12 px girado 45° que apunta a la boca de Don Pascal, a la izquierda de su cara sin tocarla.

### Paneles (carrito y chat)
`<dialog>` nativos sobre un fondo de tinta al 50 %. El carrito ocupa el alto entero a la derecha (máximo 28rem); el chat, la pantalla entera en el móvil y una tarjeta de 25rem con sombra flotante abajo a la derecha desde sm. Cabecera del chat en monte con el avatar, cuerpo en superficie.

### Movimiento
Curvas, duraciones y distancias son tokens del bloque final de `src/styles/global.css`; el JS está en `src/scripts/movimiento.ts`. Solo se animan propiedades que no recalculan el diseño, y siempre desde un estado ya visible: si el JS no llega, todo se ve.

- **Entrada del hero:** primero el texto, de arriba abajo (las dos líneas del titular, el apoyo, el buscador, el enlace al chat y el aviso): opacidad, 12 px de recorrido y desenfoque de 3 px en 500 ms, escalonado 80 ms. Después crece el arco y Don Pascal sube desde detrás (800 ms, curva de llegada) y saluda con un leve balanceo. Por último brotan las insignias desde escala 0 (el bocadillo desde su pico a los 900 ms, el horario desde su icono a los 1150 ms), sin opacidad para que su contraste nunca se mida a medias.
- **Vaivén de las insignias:** 6 px arriba y abajo en 5.5 s y 6.5 s, solo desde 1024 px con hover y puntero fino, y en pausa cuando el hero sale de pantalla.
- **Revelado al hacer scroll:** solo se esconde lo que está por debajo de la pantalla al cargar, y aparece al entrar (opacidad y 12 px, 500 ms) o en cuanto algo suyo recibe el foco. Las listas se escalonan 40 ms por elemento, hasta 6 pasos. Los ejemplos de pregunta llegan como burbujas desde su esquina.
- **Paneles:** el carrito entra desde la derecha y el chat desde abajo con `@starting-style`; abrir dura 400 ms y cerrar 350 ms, con el fondo fundiéndose a la vez.
- **Contador:** un pulso de escala 1.35 en 320 ms al añadir.

**La Regla de la Curva sin Rebote.** Todo usa la curva suave (`cubic-bezier(0.22, 1, 0.36, 1)`): abrir, cerrar, llegar, brotar y hover. La curva de llegada (`cubic-bezier(0.16, 1, 0.3, 1)`) es solo para la llegada de Don Pascal. Ninguna curva rebota ni se pasa de su destino.

**La Regla del Quieto.** Con `prefers-reduced-motion: reduce` no hay ninguna animación ni transición, tampoco las de hover ni las del fondo de los diálogos (constitución II).

### Fotos de producto
Dos formas, las dos generadas con IA y acreditadas en el pie («fotos de producto generadas con IA»):

- **De estudio** (tarjetas, catálogo y ficha): packshots cuadrados sobre un fondo de estudio gris, recortados por el radio de su contenedor.
- **Recortadas** (banners de oferta): el mismo producto sin fondo, en `src/assets/productos/recortes/` con su procedencia incrustada (generado con Nano Banana y fondo quitado por el usuario). `scripts/imagenes.sh` quita el margen transparente y vuelve a cuadrar con un 6 % de aire, así cada producto llena su hueco, y las sirve en WebP con transparencia.

**La Regla del Producto que Flota.** Sobre un color de marca, el producto va recortado y flota; la baldosa gris de estudio solo va sobre papel o superficie.

### Página 404
Se genera en el Worker con la tienda completa: cabecera con el carrito, chat y pie. Titular de sección, texto, el buscador y «Volver al inicio» en maíz; desde lg, a la derecha, Don Pascal sin insignias sobre un arco pradera que se apoya en el pie.

## Do's and Don'ts

### Do:
- **Do** usar los roles de color de `global.css` en cada componente; un hex nuevo entra primero como token.
- **Do** poner texto en tinta sobre maíz, ají, hoja y pradera.
- **Do** rotar los banners de oferta en el orden maíz, ají, hoja, pradera.
- **Do** formatear todo importe con `formatoUsd` o `formatoBs` (espacio duro incluido) y marcar sus cifras con `precio`.
- **Do** mantener 13 px (`--text-mini`) como el tamaño más pequeño.
- **Do** usar píldora para botones, campos, chips e insignias, y 20 px para tarjetas y banners.
- **Do** dar a cada animación nueva la curva suave y una duración de la escala (`--mov-*`), y comprobar que con reduced-motion queda quieta.
- **Do** apoyar a Don Pascal sobre su arco, nacido del borde de su sección.

### Don't:
- **Don't** usar el ají fuera de los banners de oferta y del chip de descuento.
- **Don't** escribir texto en hoja sobre papel; para eso está hoja-texto.
- **Don't** usar la línea como borde de un control; los controles se bordean en tinta suave.
- **Don't** usar curvas con rebote.
- **Don't** animar propiedades que recalculan el diseño (`width`, `height`, `top`, `left`, `margin`).
- **Don't** esconder al cargar contenido que ya está en pantalla.
- **Don't** usar sombras duras o desplazadas sin desenfoque.
- **Don't** poner cuentas atrás, existencias («quedan 2»), estrellas ni valoraciones en ofertas o tarjetas.
