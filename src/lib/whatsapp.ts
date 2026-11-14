// Enlaces de WhatsApp (plan §5). El número de la tienda sale de la variable de build
// PUBLIC_STORE_WHATSAPP; vacío, la web no ofrece WhatsApp y el carrito pasa a «Copiar».
import { bolivares, formatoBs, formatoUsd, precioUnitario, type PrecioBase } from './precios';

/** Solo los dígitos, con código de país; null si no parece un número. */
export function numeroTienda(valor: string | undefined): string | null {
  const digitos = (valor ?? '').replace(/\D/g, '');
  return digitos.length >= 10 && digitos.length <= 15 ? digitos : null;
}

export function enlaceWhatsApp(texto: string, numero: string | null): string | null {
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : null;
}

/** Mensaje para pedir una unidad de un producto desde su ficha o su tarjeta. */
export function mensajeProducto(p: PrecioBase & { nombre: string; presentacion: string }, tasa: number): string {
  const precio = precioUnitario(p);
  return `Hola, Don Pascal. Quiero pedir 1 × ${p.nombre} (${p.presentacion}): ${formatoUsd(precio)} / ${formatoBs(bolivares(precio, tasa))}. (Precios de ejemplo.)`;
}

/** El número configurado en el build. */
export const NUMERO_TIENDA = numeroTienda(import.meta.env.PUBLIC_STORE_WHATSAPP);
