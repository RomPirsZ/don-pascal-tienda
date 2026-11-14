// Carrito (plan §5). Solo guarda slugs y cantidades; los precios se recalculan siempre con el
// catálogo, así un carrito viejo o manipulado nunca muestra un precio que no es el vigente.
import { bolivares, formatoBs, formatoUsd, precioUnitario, type PrecioBase } from './precios';

export interface Linea {
  slug: string;
  cantidad: number;
}

export interface ProductoCarrito extends PrecioBase {
  slug: string;
  nombre: string;
  presentacion: string;
  disponible: boolean;
}

export interface ItemResumen {
  producto: ProductoCarrito;
  cantidad: number;
  /** Centavos por unidad, ya con oferta o precio al mayor */
  unitario: number;
  subtotal: number;
  alMayor: boolean;
}

export interface Resumen {
  items: ItemResumen[];
  /** Centavos de dólar */
  total: number;
  /** Céntimos de bolívar */
  totalBs: number;
  unidades: number;
  /** Slugs guardados que ya no existen o están agotados */
  omitidos: string[];
}

export const CANTIDAD_MAXIMA = 99;
export const LINEAS_MAXIMAS = 50;
const SLUG = /^[a-z0-9-]{2,60}$/;

const acotar = (cantidad: number) => Math.min(CANTIDAD_MAXIMA, cantidad);

/** Valida lo leído del navegador: descarta lo que no tiene la forma esperada. */
export function normalizar(datos: unknown): Linea[] {
  if (!Array.isArray(datos)) return [];
  const lineas: Linea[] = [];
  for (const d of datos) {
    if (typeof d !== 'object' || d === null) continue;
    const { slug, cantidad } = d as Record<string, unknown>;
    if (typeof slug !== 'string' || !SLUG.test(slug) || !Number.isInteger(cantidad) || (cantidad as number) < 1) continue;
    const existente = lineas.find((l) => l.slug === slug);
    if (existente) existente.cantidad = acotar(existente.cantidad + (cantidad as number));
    else if (lineas.length < LINEAS_MAXIMAS) lineas.push({ slug, cantidad: acotar(cantidad as number) });
  }
  return lineas;
}

export function anadir(lineas: readonly Linea[], slug: string, n = 1): Linea[] {
  const existente = lineas.find((l) => l.slug === slug);
  if (existente) return lineas.map((l) => (l.slug === slug ? { slug, cantidad: acotar(l.cantidad + n) } : l));
  return lineas.length >= LINEAS_MAXIMAS ? [...lineas] : [...lineas, { slug, cantidad: acotar(n) }];
}

export function fijarCantidad(lineas: readonly Linea[], slug: string, cantidad: number): Linea[] {
  if (cantidad < 1) return quitar(lineas, slug);
  return lineas.map((l) => (l.slug === slug ? { slug, cantidad: acotar(Math.floor(cantidad)) } : l));
}

export function quitar(lineas: readonly Linea[], slug: string): Linea[] {
  return lineas.filter((l) => l.slug !== slug);
}

export function resumir(lineas: readonly Linea[], productos: readonly ProductoCarrito[], tasa: number): Resumen {
  const items: ItemResumen[] = [];
  const omitidos: string[] = [];
  for (const { slug, cantidad } of lineas) {
    const producto = productos.find((p) => p.slug === slug);
    if (!producto || !producto.disponible) {
      omitidos.push(slug);
      continue;
    }
    const unitario = precioUnitario(producto, cantidad);
    items.push({ producto, cantidad, unitario, subtotal: unitario * cantidad, alMayor: unitario < precioUnitario(producto) });
  }
  const total = items.reduce((suma, i) => suma + i.subtotal, 0);
  return { items, total, totalBs: bolivares(total, tasa), unidades: items.reduce((s, i) => s + i.cantidad, 0), omitidos };
}

/** El texto que llega a la tienda por WhatsApp. */
export function mensajePedido(resumen: Resumen, { tasa, tasaFecha }: { tasa: number; tasaFecha: string }): string {
  const [anio, mes, dia] = tasaFecha.split('-');
  return [
    'Hola, Don Pascal. Quiero hacer este pedido:',
    ...resumen.items.map(
      (i) => `• ${i.cantidad} × ${i.producto.nombre} (${i.producto.presentacion})${i.alMayor ? ', al mayor' : ''}: ${formatoUsd(i.subtotal)}`,
    ),
    `Total: ${formatoUsd(resumen.total)} (${formatoBs(resumen.totalBs)})`,
    `Tasa de ejemplo: ${formatoBs(Math.round(tasa * 100))} por dólar (${dia}/${mes}/${anio}). Precios de ejemplo.`,
  ].join('\n');
}
