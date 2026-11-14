// Filtros del catálogo (spec §4). Llegan por la URL del formulario GET, que funciona sin JS:
// el texto se recorta y la categoría solo vale si existe.
import { buscarProductos, type Categoria, type Producto } from './catalogo';
import { ahorroMayor } from './precios';

export interface Filtros {
  texto: string;
  /** Slug de una categoría existente */
  categoria: string | null;
  /** Solo productos con precio al mayor */
  mayor: boolean;
}

export const LARGO_MAXIMO_BUSQUEDA = 60;

export function leerFiltros(params: URLSearchParams, categorias: readonly Categoria[]): Filtros {
  const categoria = params.get('categoria');
  return {
    texto: (params.get('q') ?? '').trim().slice(0, LARGO_MAXIMO_BUSQUEDA).trim(),
    categoria: categorias.some((c) => c.slug === categoria) ? categoria : null,
    mayor: params.get('mayor') === '1',
  };
}

export function aplicarFiltros(productos: readonly Producto[], filtros: Filtros): Producto[] {
  const encontrados = buscarProductos(productos, filtros.texto, filtros.categoria ?? undefined);
  return filtros.mayor ? encontrados.filter((p) => ahorroMayor(p) > 0) : encontrados;
}

/** URL del catálogo con los filtros actuales y los cambios indicados. */
export function urlCatalogo(actual: Filtros, cambios: Partial<Filtros>): string {
  const f = { ...actual, ...cambios };
  const params = new URLSearchParams();
  if (f.texto) params.set('q', f.texto);
  if (f.categoria) params.set('categoria', f.categoria);
  if (f.mayor) params.set('mayor', '1');
  const consulta = params.toString();
  return `/productos/${consulta ? `?${consulta}` : ''}`;
}
