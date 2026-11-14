// Catálogo (plan §4): se lee de Supabase con su API REST, sin SDK, con la clave publishable
// (rol anon, que solo puede leer). Sin Supabase configurado (desarrollo y CI) se usa el
// catálogo de ejemplo local, que es el mismo del SQL. La búsqueda se hace aquí, en memoria:
// la web y el asistente buscan con la misma función.
import { CATALOGO_EJEMPLO } from '../data/catalogo-ejemplo';
import type { PrecioBase } from './precios';

export interface Categoria {
  slug: string;
  nombre: string;
  orden: number;
}

export interface Producto extends PrecioBase {
  slug: string;
  nombre: string;
  /** Slug de su categoría */
  categoria: string;
  presentacion: string;
  descripcion: string;
  disponible: boolean;
  destacado: boolean;
  palabrasClave: string;
}

export interface Ajustes {
  /** Bolívares por dólar (de ejemplo) */
  tasaBcv: number;
  /** AAAA-MM-DD */
  tasaFecha: string;
  horario: string;
  direccion: string;
}

export interface Catalogo {
  categorias: Categoria[];
  productos: Producto[];
  ajustes: Ajustes;
  origen: 'supabase' | 'ejemplo';
}

interface Opciones {
  /** URL del proyecto (https://<ref>.supabase.co) */
  url?: string | undefined;
  /** Clave publishable; nunca la secreta */
  key?: string | undefined;
  /** Inyectables para los tests */
  fetch?: typeof globalThis.fetch;
  ahora?: () => number;
  timeoutMs?: number;
}

/** Un minuto: los precios cambian poco y así no se consulta Supabase en cada visita. */
const VIDA_CACHE_MS = 60_000;
let cache: { clave: string; expira: number; catalogo: Catalogo } | undefined;

export function limpiarCache(): void {
  cache = undefined;
}

const esTexto = (v: unknown): v is string => typeof v === 'string';
const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const numeroONulo = (v: unknown): number | null => {
  if (v === null) return null;
  if (esNumero(v)) return v;
  throw new TypeError('número inválido');
};

function aProducto(fila: Record<string, unknown>): Producto {
  const categoria = (fila['categoria'] as { slug?: unknown } | null)?.slug;
  const textos = ['slug', 'nombre', 'presentacion', 'descripcion', 'palabras_clave'] as const;
  if (!textos.every((k) => esTexto(fila[k])) || !esTexto(categoria) || !esNumero(fila['precio_usd'])) {
    throw new TypeError('producto con forma inesperada');
  }
  return {
    slug: fila['slug'] as string,
    nombre: fila['nombre'] as string,
    categoria,
    presentacion: fila['presentacion'] as string,
    descripcion: fila['descripcion'] as string,
    precioUsd: fila['precio_usd'],
    precioMayorUsd: numeroONulo(fila['precio_mayor_usd']),
    minimoMayor: numeroONulo(fila['minimo_mayor']),
    ofertaPct: numeroONulo(fila['oferta_pct']),
    disponible: fila['disponible'] === true,
    destacado: fila['destacado'] === true,
    palabrasClave: fila['palabras_clave'] as string,
  };
}

function aCategoria(fila: Record<string, unknown>): Categoria {
  if (!esTexto(fila['slug']) || !esTexto(fila['nombre']) || !esNumero(fila['orden'])) throw new TypeError('categoría con forma inesperada');
  return { slug: fila['slug'], nombre: fila['nombre'], orden: fila['orden'] };
}

function aAjustes(filas: Record<string, unknown>[]): Ajustes {
  const valores = new Map(filas.map((f) => [f['clave'], f['valor']]));
  const tasa = Number(valores.get('tasa_bcv'));
  const [fecha, horario, direccion] = ['tasa_fecha', 'horario', 'direccion'].map((k) => valores.get(k));
  if (!(tasa > 0) || !esTexto(fecha) || !esTexto(horario) || !esTexto(direccion)) throw new TypeError('ajustes incompletos');
  return { tasaBcv: tasa, tasaFecha: fecha, horario, direccion };
}

const CONSULTAS = {
  categorias: 'categorias?select=slug,nombre,orden&order=orden',
  productos:
    'productos?select=slug,nombre,presentacion,descripcion,precio_usd,precio_mayor_usd,minimo_mayor,oferta_pct,disponible,destacado,palabras_clave,categoria:categorias(slug)&order=nombre',
  ajustes: 'ajustes?select=clave,valor',
};

/**
 * El catálogo completo. Lanza un error si Supabase está configurado y falla: nunca se
 * muestran los precios de ejemplo como si fueran los de la base de datos.
 */
export async function leerCatalogo({ url, key, fetch = globalThis.fetch, ahora = Date.now, timeoutMs = 5000 }: Opciones): Promise<Catalogo> {
  if (!url || !key) return { ...CATALOGO_EJEMPLO, origen: 'ejemplo' };

  const base = `${url.replace(/\/+$/, '')}/rest/v1/`;
  if (cache && cache.clave === base && cache.expira > ahora()) return cache.catalogo;

  const pedir = async (consulta: string): Promise<Record<string, unknown>[]> => {
    const respuesta = await fetch(base + consulta, { headers: { apikey: key }, signal: AbortSignal.timeout(timeoutMs) });
    if (!respuesta.ok) throw new Error(`supabase-http-${respuesta.status}`);
    const datos: unknown = await respuesta.json();
    if (!Array.isArray(datos)) throw new TypeError('respuesta inesperada');
    return datos as Record<string, unknown>[];
  };

  const [categorias, productos, ajustes] = await Promise.all([pedir(CONSULTAS.categorias), pedir(CONSULTAS.productos), pedir(CONSULTAS.ajustes)]);
  const catalogo: Catalogo = {
    categorias: categorias.map(aCategoria),
    productos: productos.map(aProducto),
    ajustes: aAjustes(ajustes),
    origen: 'supabase',
  };
  cache = { clave: base, expira: ahora() + VIDA_CACHE_MS, catalogo };
  return catalogo;
}

/** Minúsculas, sin tildes y con un solo espacio entre palabras. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Raíz simple para que «harinas», «panes» o «quesos» encuentren el singular. */
function raiz(palabra: string): string {
  if (palabra.length > 4 && palabra.endsWith('es')) return palabra.slice(0, -2);
  if (palabra.length > 3 && palabra.endsWith('s')) return palabra.slice(0, -1);
  return palabra;
}

/**
 * Productos que contienen todas las palabras del texto (en el nombre, la presentación o las
 * palabras clave) y, si se indica, de una categoría. Primero los que coinciden en el nombre.
 */
export function buscarProductos(productos: readonly Producto[], texto: string, categoria?: string): Producto[] {
  const palabras = normalizar(texto).split(' ').filter((p) => p.length >= 2).map(raiz);
  const candidatos = productos.filter((p) => !categoria || p.categoria === categoria);
  if (palabras.length === 0) return [...candidatos];

  const conPuntos = candidatos.flatMap((p) => {
    const nombre = normalizar(p.nombre);
    const todo = `${nombre} ${normalizar(p.presentacion)} ${normalizar(p.palabrasClave)}`;
    if (!palabras.every((palabra) => todo.includes(palabra))) return [];
    const enNombre = palabras.filter((palabra) => nombre.includes(palabra)).length;
    return [{ p, puntos: enNombre * 2 + (p.destacado ? 1 : 0) }];
  });
  return conPuntos.sort((a, b) => b.puntos - a.puntos || a.p.nombre.localeCompare(b.p.nombre, 'es')).map(({ p }) => p);
}
