// Herramientas del asistente (plan §6). Todas son de solo lectura sobre el catálogo y usan
// las mismas funciones de precio que la web y el carrito, así una cifra nunca sale distinta.
// Devuelven los precios ya formateados con su moneda («$ 1,30», «Bs 1.185,11», «10 %»):
// price-guard solo deja pasar una cifra con moneda si salió así de una herramienta (E08).
import type Anthropic from '@anthropic-ai/sdk';
import { t } from '../../i18n';
import { resumir } from '../carrito';
import { buscarProductos, type Catalogo, type Producto } from '../catalogo';
import { aCentavos, ahorroMayor, bolivares, formatoBs, formatoUsd, precioUnitario } from '../precios';

const MAXIMO_RESULTADOS = 8;
const LARGO_MAXIMO_TEXTO = 100;
const ITEMS_MAXIMOS = 50;
const CANTIDAD_MAXIMA = 99;
const SLUG = /^[a-z0-9-]{2,60}$/;

// Texto fijo: forma parte del prefijo que se guarda en caché. Nada de datos que cambian.
export const HERRAMIENTAS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'buscar_productos',
    description:
      'Busca productos del catálogo de la tienda por palabras (nombre, tipo o presentación), opcionalmente dentro de una categoría. ' +
      'Devuelve hasta 8 productos con su presentación, precio en dólares y en bolívares, oferta, precio al mayor y si hay disponibilidad, ' +
      'y cuántos productos coinciden en total. Con el texto vacío lista la categoría. ' +
      'Úsala siempre que el cliente pregunte si hay algo o cuánto cuesta.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        texto: { type: 'string', description: 'Palabras a buscar, por ejemplo «harina de trigo». Puede ir vacío.' },
        categoria: {
          type: 'string',
          description: 'Slug de la categoría: reposteria, panaderia, viveres, charcuteria, bebidas o limpieza.',
        },
      },
      required: ['texto'],
      additionalProperties: false,
    },
  },
  {
    name: 'ver_producto',
    description:
      'Da la ficha completa de un producto por su slug (el que devuelve buscar_productos): descripción, presentación, precios, oferta, ' +
      'precio al mayor y disponibilidad. Si el slug no existe, responde que no está en el catálogo.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'Slug del producto, por ejemplo «harina-trigo-leudante-1kg».' } },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'calcular_total',
    description:
      'Calcula lo que cuesta una lista de productos: precio por unidad (con oferta, o al mayor si se llega al mínimo), subtotales y ' +
      'el total en dólares y en bolívares a la tasa de la tienda. Indica los slugs que no existen y los agotados, que no se suman. ' +
      'Úsala para cualquier suma, aunque sea de un solo producto con varias unidades. Cantidades enteras de 1 a 99 por producto.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Productos con su cantidad, hasta 50.',
          items: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'Slug del producto.' },
              cantidad: { type: 'integer', description: 'Unidades, de 1 a 99.' },
            },
            required: ['slug', 'cantidad'],
            additionalProperties: false,
          },
        },
      },
      required: ['items'],
      additionalProperties: false,
    },
  },
  {
    name: 'info_tienda',
    description:
      'Datos de la tienda: horario, dirección, la tasa de cambio y su fecha, las categorías, cómo funciona la compra al mayor y al detal, ' +
      'y cómo pedir (WhatsApp, retiro en tienda o delivery).',
    strict: true,
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
];

export interface Salida {
  /** Lo que recibe el modelo, serializado como JSON */
  resultado: unknown;
  /** true: se devuelve como tool_result con is_error */
  error: boolean;
}

const fallo = (mensaje: string, extra: Record<string, unknown> = {}): Salida => ({ resultado: { error: mensaje, ...extra }, error: true });
const bien = (resultado: unknown): Salida => ({ resultado, error: false });
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function ficha(p: Producto, catalogo: Catalogo) {
  const tasa = catalogo.ajustes.tasaBcv;
  const unitario = precioUnitario(p);
  const mayor = ahorroMayor(p) > 0 ? precioUnitario(p, p.minimoMayor as number) : null;
  return {
    slug: p.slug,
    nombre: p.nombre,
    presentacion: p.presentacion,
    categoria: catalogo.categorias.find((c) => c.slug === p.categoria)?.nombre ?? p.categoria,
    precio: formatoUsd(unitario),
    precio_bs: formatoBs(bolivares(unitario, tasa)),
    precio_antes: p.ofertaPct ? formatoUsd(aCentavos(p.precioUsd)) : null,
    oferta: p.ofertaPct ? `${p.ofertaPct} %` : null,
    al_mayor:
      mayor === null
        ? null
        : { minimo: p.minimoMayor, precio: `${formatoUsd(mayor)} c/u`, precio_bs: `${formatoBs(bolivares(mayor, tasa))} c/u` },
    disponible: p.disponible,
  };
}

function buscar(entrada: unknown, catalogo: Catalogo): Salida {
  if (!esObjeto(entrada) || typeof entrada['texto'] !== 'string' || entrada['texto'].length > LARGO_MAXIMO_TEXTO) {
    return fallo(`Hace falta «texto», de ${LARGO_MAXIMO_TEXTO} caracteres como mucho.`);
  }
  const categoria = entrada['categoria'];
  if (categoria !== undefined && typeof categoria !== 'string') return fallo('«categoria» tiene que ser un texto.');
  if (categoria && !catalogo.categorias.some((c) => c.slug === categoria)) {
    return fallo('Esa categoría no existe.', { categorias: catalogo.categorias.map((c) => c.slug) });
  }
  const encontrados = buscarProductos(catalogo.productos, entrada['texto'], categoria || undefined);
  return bien({ encontrados: encontrados.length, productos: encontrados.slice(0, MAXIMO_RESULTADOS).map((p) => ficha(p, catalogo)) });
}

function ver(entrada: unknown, catalogo: Catalogo): Salida {
  if (!esObjeto(entrada) || typeof entrada['slug'] !== 'string' || !SLUG.test(entrada['slug'])) {
    return fallo('Hace falta el «slug» de un producto, en minúsculas y con guiones.');
  }
  const producto = catalogo.productos.find((p) => p.slug === entrada['slug']);
  if (!producto) return bien({ encontrado: false });
  return bien({ encontrado: true, producto: { ...ficha(producto, catalogo), descripcion: producto.descripcion } });
}

function calcular(entrada: unknown, catalogo: Catalogo): Salida {
  const items = esObjeto(entrada) ? entrada['items'] : undefined;
  if (!Array.isArray(items) || items.length === 0 || items.length > ITEMS_MAXIMOS) {
    return fallo(`Hace falta «items» con entre 1 y ${ITEMS_MAXIMOS} productos.`);
  }
  // Las líneas repetidas se juntan: así el precio al mayor se aplica a la cantidad total
  const cantidades = new Map<string, number>();
  for (const item of items) {
    const { slug, cantidad } = esObjeto(item) ? item : {};
    if (typeof slug !== 'string' || !SLUG.test(slug) || !Number.isInteger(cantidad) || (cantidad as number) < 1) {
      return fallo('Cada producto necesita un «slug» válido y una «cantidad» entera desde 1.');
    }
    const suma = (cantidades.get(slug) ?? 0) + (cantidad as number);
    if (suma > CANTIDAD_MAXIMA) return fallo(`Como mucho ${CANTIDAD_MAXIMA} unidades por producto.`);
    cantidades.set(slug, suma);
  }

  const lineas = [...cantidades].map(([slug, cantidad]) => ({ slug, cantidad }));
  const resumen = resumir(lineas, catalogo.productos, catalogo.ajustes.tasaBcv);
  const existe = (slug: string) => catalogo.productos.some((p) => p.slug === slug);
  return bien({
    lineas: resumen.items.map((i) => ({
      slug: i.producto.slug,
      nombre: i.producto.nombre,
      presentacion: i.producto.presentacion,
      cantidad: i.cantidad,
      precio_unitario: formatoUsd(i.unitario),
      al_mayor: i.alMayor,
      subtotal: formatoUsd(i.subtotal),
    })),
    total: formatoUsd(resumen.total),
    total_bs: formatoBs(resumen.totalBs),
    no_encontrados: resumen.omitidos.filter((slug) => !existe(slug)),
    agotados: resumen.omitidos.filter(existe),
  });
}

function info(catalogo: Catalogo): Salida {
  const { ajustes } = catalogo;
  return bien({
    tienda: 'Don Pascal',
    aviso: t('aviso.concepto'),
    horario: ajustes.horario,
    direccion: ajustes.direccion,
    // Igual que en la web: la tasa con dos decimales
    tasa: `$ 1 = ${formatoBs(Math.round(ajustes.tasaBcv * 100))}`,
    tasa_fecha: ajustes.tasaFecha,
    categorias: catalogo.categorias.map(({ slug, nombre }) => ({ slug, nombre })),
    al_mayor: t('mayor.texto'),
    como_pedir: ([1, 2, 3] as const).map((n) => `${t(`como.paso${n}.titulo`)}: ${t(`como.paso${n}.texto`)}`),
  });
}

/** Ejecuta una herramienta con la entrada que pidió el modelo. Nunca lanza: los fallos van como error. */
export function ejecutarHerramienta(nombre: string, entrada: unknown, catalogo: Catalogo): Salida {
  switch (nombre) {
    case 'buscar_productos':
      return buscar(entrada, catalogo);
    case 'ver_producto':
      return ver(entrada, catalogo);
    case 'calcular_total':
      return calcular(entrada, catalogo);
    case 'info_tienda':
      return info(catalogo);
    default:
      return fallo('Esa herramienta no existe.');
  }
}
