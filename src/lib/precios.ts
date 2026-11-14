// Precios (plan §5). Todo se calcula en centavos enteros y en un solo sitio: la web, el
// carrito, el mensaje de WhatsApp y el asistente usan estas funciones, así una misma
// cifra nunca sale distinta en dos lugares.

/** Lo que hace falta de un producto para calcular su precio. */
export interface PrecioBase {
  precioUsd: number;
  precioMayorUsd: number | null;
  minimoMayor: number | null;
  ofertaPct: number | null;
}

/** De dólares con dos decimales (numeric de Postgres) a centavos enteros. */
export function aCentavos(usd: number): number {
  return Math.round(usd * 100 + Number.EPSILON * 100);
}

function exigirCantidad(cantidad: number): void {
  if (!Number.isInteger(cantidad) || cantidad < 1) throw new RangeError(`Cantidad inválida: ${cantidad}`);
}

export const tieneMayor = (p: PrecioBase): boolean => p.precioMayorUsd !== null && p.minimoMayor !== null;

/**
 * Precio por unidad en centavos para una cantidad: el de oferta si la hay y, desde el
 * mínimo al mayor, el más bajo entre ese y el de mayor.
 */
export function precioUnitario(p: PrecioBase, cantidad = 1): number {
  exigirCantidad(cantidad);
  const lista = aCentavos(p.precioUsd);
  const conOferta = p.ofertaPct ? Math.round((lista * (100 - p.ofertaPct)) / 100) : lista;
  if (tieneMayor(p) && cantidad >= (p.minimoMayor as number)) {
    return Math.min(conOferta, aCentavos(p.precioMayorUsd as number));
  }
  return conOferta;
}

/** Precio de `cantidad` unidades, en centavos. */
export function subtotal(p: PrecioBase, cantidad: number): number {
  return precioUnitario(p, cantidad) * cantidad;
}

/** De centavos de dólar a céntimos de bolívar con la tasa del día. */
export function bolivares(centavosUsd: number, tasa: number): number {
  if (!Number.isFinite(tasa) || tasa <= 0) throw new RangeError(`Tasa inválida: ${tasa}`);
  return Math.round(centavosUsd * tasa);
}

const numero = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatoUsd = (centavos: number): string => `$ ${numero.format(centavos / 100)}`;
export const formatoBs = (centimos: number): string => `Bs ${numero.format(centimos / 100)}`;
