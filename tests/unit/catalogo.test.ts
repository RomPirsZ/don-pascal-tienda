// Catálogo (plan §4): lectura de Supabase con su API REST, el respaldo local y la búsqueda.
// Se escribe antes que src/lib/catalogo.ts (constitución VI).
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CATALOGO_EJEMPLO } from '../../src/data/catalogo-ejemplo';
import { buscarProductos, leerCatalogo, limpiarCache, normalizar } from '../../src/lib/catalogo';

const sql = readFileSync('supabase/catalogo-ejemplo.sql', 'utf8');
const num = (v: string) => (v === 'null' ? null : Number(v));

describe('el catálogo local es el mismo que el SQL de ejemplo', () => {
  it('productos', () => {
    const filas = [
      ...sql.matchAll(
        /\('([^']*)', '([^']*)', '([^']*)', '([^']*)',\s*'([^']*)', ([\d.]+), ([\d.]+|null), (\d+|null), (\d+|null), (true|false),\s*'([^']*)'\)/g,
      ),
    ].map(([, slug, nombre, categoria, presentacion, descripcion, precio, mayor, minimo, oferta, destacado, palabras]) => ({
      slug,
      nombre,
      categoria,
      presentacion,
      descripcion,
      precioUsd: Number(precio),
      precioMayorUsd: num(mayor!),
      minimoMayor: num(minimo!),
      ofertaPct: num(oferta!),
      disponible: true,
      destacado: destacado === 'true',
      palabrasClave: palabras,
    }));
    expect(filas).toHaveLength(33);
    expect(CATALOGO_EJEMPLO.productos).toEqual(filas);
  });

  it('categorías y ajustes', () => {
    const categorias = [...sql.matchAll(/\('([a-z]+)', '([^']+)', (\d+)\)/g)].map(([, slug, nombre, orden]) => ({ slug, nombre, orden: Number(orden) }));
    expect(CATALOGO_EJEMPLO.categorias).toEqual(categorias);
    const ajustes = Object.fromEntries([...sql.matchAll(/\('(tasa_bcv|tasa_fecha|horario|direccion)', '([^']*)'\)/g)].map(([, k, v]) => [k, v]));
    expect(CATALOGO_EJEMPLO.ajustes).toEqual({
      tasaBcv: Number(ajustes['tasa_bcv']),
      tasaFecha: ajustes['tasa_fecha'],
      horario: ajustes['horario'],
      direccion: ajustes['direccion'],
    });
  });

  it('cada producto tiene su foto en src/assets/productos/', () => {
    for (const { slug } of CATALOGO_EJEMPLO.productos) {
      expect(() => readFileSync(`src/assets/productos/${slug}.jpg`), slug).not.toThrow();
    }
  });
});

/** Respuestas de PostgREST con la forma que piden las consultas de catalogo.ts. */
function supabaseFalso({ fallar = false } = {}) {
  return vi.fn(async (url: string | URL | Request) => {
    if (fallar) return new Response('{}', { status: 500 });
    const ruta = new URL(String(url)).pathname;
    if (ruta.endsWith('/categorias')) return Response.json([{ slug: 'viveres', nombre: 'Víveres', orden: 3 }]);
    if (ruta.endsWith('/ajustes'))
      return Response.json([
        { clave: 'tasa_bcv', valor: '240.5' },
        { clave: 'tasa_fecha', valor: '2026-11-15' },
        { clave: 'horario', valor: 'Todos los días' },
        { clave: 'direccion', valor: 'Guanare' },
      ]);
    return Response.json([
      {
        slug: 'arroz-blanco-1kg',
        nombre: 'Arroz blanco',
        presentacion: '1 kg',
        descripcion: '',
        precio_usd: 1.25,
        precio_mayor_usd: 1.05,
        minimo_mayor: 20,
        oferta_pct: null,
        disponible: true,
        destacado: false,
        palabras_clave: 'arroz',
        categoria: { slug: 'viveres' },
      },
    ]);
  });
}

describe('leerCatalogo', () => {
  beforeEach(() => limpiarCache());

  it('sin Supabase configurado usa el catálogo de ejemplo', async () => {
    const catalogo = await leerCatalogo({});
    expect(catalogo.origen).toBe('ejemplo');
    expect(catalogo.productos).toHaveLength(33);
  });

  it('con Supabase lee las tres tablas con la clave publishable y traduce las columnas', async () => {
    const fetch = supabaseFalso();
    const catalogo = await leerCatalogo({ url: 'https://abc.supabase.co/', key: 'clave', fetch });
    expect(fetch).toHaveBeenCalledTimes(3);
    for (const [, init] of fetch.mock.calls as unknown as [string, RequestInit][]) {
      expect(new Headers(init.headers).get('apikey')).toBe('clave');
    }
    expect(catalogo.origen).toBe('supabase');
    expect(catalogo.ajustes.tasaBcv).toBe(240.5);
    expect(catalogo.productos[0]).toMatchObject({ slug: 'arroz-blanco-1kg', categoria: 'viveres', precioUsd: 1.25, minimoMayor: 20 });
  });

  it('guarda el resultado un minuto para no consultar en cada visita', async () => {
    const fetch = supabaseFalso();
    let ahora = 1_000_000;
    const opciones = { url: 'https://abc.supabase.co', key: 'clave', fetch, ahora: () => ahora };
    await leerCatalogo(opciones);
    await leerCatalogo(opciones);
    expect(fetch).toHaveBeenCalledTimes(3);
    ahora += 61_000;
    await leerCatalogo(opciones);
    expect(fetch).toHaveBeenCalledTimes(6);
  });

  it('si Supabase falla, lanza un error: nunca muestra precios de ejemplo como si fueran los reales', async () => {
    await expect(leerCatalogo({ url: 'https://abc.supabase.co', key: 'clave', fetch: supabaseFalso({ fallar: true }) })).rejects.toThrow();
  });

  it('rechaza filas con una forma inesperada', async () => {
    const fetch = vi.fn(async (url: string | URL | Request) =>
      String(url).includes('/productos') ? Response.json([{ slug: 'x', precio_usd: 'gratis' }]) : supabaseFalso()(url),
    );
    await expect(leerCatalogo({ url: 'https://abc.supabase.co', key: 'clave', fetch })).rejects.toThrow();
  });
});

describe('búsqueda', () => {
  const productos = CATALOGO_EJEMPLO.productos;
  const slugs = (texto: string, categoria?: string) => buscarProductos(productos, texto, categoria).map((p) => p.slug);

  it('normaliza tildes, mayúsculas y espacios', () => {
    expect(normalizar('  Azúcar   GLAS ')).toBe('azucar glas');
  });

  it('encuentra por nombre, presentación o palabras clave, sin importar tildes ni plurales', () => {
    expect(slugs('azucar')).toEqual(expect.arrayContaining(['azucar-refinada-1kg', 'azucar-glas-500g']));
    expect(slugs('harinas')).toEqual(expect.arrayContaining(['harina-trigo-leudante-1kg', 'harina-maiz-1kg']));
    expect(slugs('arepa')).toEqual(['harina-maiz-1kg']);
    expect(slugs('café')).toEqual(['cafe-molido-500g']);
  });

  it('todas las palabras tienen que aparecer', () => {
    expect(slugs('harina maiz')).toEqual(['harina-maiz-1kg']);
    expect(slugs('harina chocolate')).toEqual([]);
  });

  it('filtra por categoría, también sin texto', () => {
    expect(slugs('', 'bebidas')).toHaveLength(4);
    expect(slugs('azucar', 'viveres')).toEqual([]);
  });

  it('sin texto ni categoría devuelve todo, con los coincidentes en el nombre primero', () => {
    expect(slugs('')).toHaveLength(33);
    expect(slugs('queso')[0]).toMatch(/^queso-/);
  });

  it('un producto que no existe no devuelve nada', () => {
    expect(slugs('iphone')).toEqual([]);
  });
});

describe('imágenes preparadas (scripts/imagenes.sh)', () => {
  it('cada producto del catálogo tiene sus cuatro anchos en WebP', () => {
    for (const { slug } of CATALOGO_EJEMPLO.productos) {
      for (const ancho of [240, 360, 480, 640]) {
        expect(() => readFileSync(`public/img/productos/${slug}-${ancho}.webp`), `${slug}-${ancho}`).not.toThrow();
      }
    }
  });
});
