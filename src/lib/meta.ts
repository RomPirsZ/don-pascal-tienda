// Descripciones para buscadores y vistas previas (E17): nunca más de LARGO_DESCRIPCION.
import { t } from '../i18n';
import type { Producto } from './catalogo';
import { bolivares, formatoBs, formatoUsd, precioUnitario } from './precios';
import { LARGO_DESCRIPCION } from './sitio';

/**
 * La de la ficha de un producto: nombre, presentación, precio en $ y Bs, su descripción y el
 * aviso de precio de ejemplo. Si con la descripción no cabe, se omite esa frase.
 */
export function descripcionFicha(p: Producto, tasa: number): string {
  const precio = precioUnitario(p);
  const datos = { nombre: p.nombre, presentacion: p.presentacion, precio: formatoUsd(precio), bs: formatoBs(bolivares(precio, tasa)) };
  const completa = t('ficha.descripcion-meta', { ...datos, descripcion: p.descripcion });
  return completa.length <= LARGO_DESCRIPCION ? completa : t('ficha.descripcion-meta-corta', datos);
}
