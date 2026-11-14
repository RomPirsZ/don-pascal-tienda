// Filtros del catálogo (spec §4): vienen de la URL (formulario GET), así que se validan.
import { describe, expect, it } from 'vitest';
import { CATALOGO_EJEMPLO } from '../../src/data/catalogo-ejemplo';
import { aplicarFiltros, leerFiltros, urlCatalogo } from '../../src/lib/filtros';

const { categorias, productos } = CATALOGO_EJEMPLO;
const filtros = (consulta: string) => leerFiltros(new URLSearchParams(consulta), categorias);

describe('leerFiltros', () => {
  it('sin parámetros: todo el catálogo', () => {
    expect(filtros('')).toEqual({ texto: '', categoria: null, mayor: false });
  });

  it('lee texto, categoría y al mayor', () => {
    expect(filtros('q=harina&categoria=viveres&mayor=1')).toEqual({ texto: 'harina', categoria: 'viveres', mayor: true });
  });

  it('recorta el texto a 60 caracteres y quita espacios', () => {
    expect(filtros(`q=${'a'.repeat(80)}`).texto).toHaveLength(60);
    expect(filtros('q=%20%20cafe%20').texto).toBe('cafe');
  });

  it('una categoría que no existe se ignora', () => {
    expect(filtros('categoria=../../etc').categoria).toBeNull();
    expect(filtros('categoria=juguetes').categoria).toBeNull();
  });

  it('«al mayor» solo con el valor 1', () => {
    expect(filtros('mayor=si').mayor).toBe(false);
  });
});

describe('aplicarFiltros', () => {
  it('combina texto, categoría y al mayor', () => {
    expect(aplicarFiltros(productos, filtros('')).length).toBe(33);
    expect(aplicarFiltros(productos, filtros('categoria=bebidas')).length).toBe(4);
    const alMayor = aplicarFiltros(productos, filtros('mayor=1'));
    expect(alMayor.length).toBeGreaterThan(0);
    expect(alMayor.every((p) => p.precioMayorUsd !== null && p.minimoMayor !== null)).toBe(true);
    expect(aplicarFiltros(productos, filtros('q=harina&categoria=viveres')).map((p) => p.slug)).toEqual(['harina-maiz-1kg']);
  });
});

describe('urlCatalogo', () => {
  it('arma la URL del catálogo conservando lo que no cambia', () => {
    const actual = { texto: 'harina', categoria: 'viveres', mayor: false };
    expect(urlCatalogo(actual, { categoria: 'reposteria' })).toBe('/productos/?q=harina&categoria=reposteria');
    expect(urlCatalogo(actual, { categoria: null })).toBe('/productos/?q=harina');
    expect(urlCatalogo({ texto: '', categoria: null, mayor: false }, { mayor: true })).toBe('/productos/?mayor=1');
    expect(urlCatalogo({ texto: '', categoria: null, mayor: false }, {})).toBe('/productos/');
  });
});
