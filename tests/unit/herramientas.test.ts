// Herramientas del asistente (plan §6): solo leen el catálogo y devuelven los precios ya
// formateados con su moneda, que es lo que price-guard acepta (E08). Se escriben antes que
// src/lib/asistente/herramientas.ts (constitución VI).
import { describe, expect, it } from 'vitest';
import { HERRAMIENTAS, ejecutarHerramienta } from '../../src/lib/asistente/herramientas';
import { cifrasNoConfirmadas } from '../../src/lib/asistente/price-guard';
import { CATALOGO_EJEMPLO } from '../../src/data/catalogo-ejemplo';
import type { Catalogo } from '../../src/lib/catalogo';

const catalogo: Catalogo = { ...CATALOGO_EJEMPLO, origen: 'ejemplo' };
const conAgotado: Catalogo = {
  ...catalogo,
  productos: catalogo.productos.map((p) => (p.slug === 'malta-355ml' ? { ...p, disponible: false } : p)),
};

const ejecutar = (nombre: string, entrada: unknown, c: Catalogo = catalogo) => ejecutarHerramienta(nombre, entrada, c);
const resultado = (nombre: string, entrada: unknown, c?: Catalogo): any => {
  const salida = ejecutar(nombre, entrada, c);
  expect(salida.error).toBe(false);
  return salida.resultado;
};

/** Todos los textos de un resultado, como si el asistente los repitiera tal cual. */
function textos(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor];
  if (Array.isArray(valor)) return valor.flatMap(textos);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(textos);
  return [];
}

describe('definiciones', () => {
  it('son las cuatro del plan, estrictas y sin propiedades extra', () => {
    expect(HERRAMIENTAS.map((h) => h.name)).toEqual(['buscar_productos', 'ver_producto', 'calcular_total', 'info_tienda']);
    for (const h of HERRAMIENTAS) {
      expect(h.strict).toBe(true);
      expect(h.description?.length).toBeGreaterThan(40);
      expect(h.input_schema.type).toBe('object');
      expect(JSON.stringify(h.input_schema)).not.toMatch(/"additionalProperties":true/);
      expect((h.input_schema as { additionalProperties?: boolean }).additionalProperties).toBe(false);
    }
  });

  it('no usan restricciones que el modo estricto no admite (se validan en el código)', () => {
    const esquemas = JSON.stringify(HERRAMIENTAS.map((h) => h.input_schema));
    expect(esquemas).not.toMatch(/"(minimum|maximum|exclusiveMinimum|exclusiveMaximum|multipleOf|minLength|maxLength|maxItems|pattern)"/);
  });

  it('no llevan datos que cambian (tasa, fecha, precios): son texto fijo para la caché', () => {
    const texto = JSON.stringify(HERRAMIENTAS);
    expect(texto).not.toMatch(/911|2026-|\$ ?\d/);
  });
});

describe('buscar_productos', () => {
  it('devuelve los productos con precios en $ y Bs y el precio al mayor', () => {
    const r = resultado('buscar_productos', { texto: 'harina de trigo' });
    expect(r.encontrados).toBe(1);
    expect(r.productos[0]).toEqual({
      slug: 'harina-trigo-leudante-1kg',
      nombre: 'Harina de trigo leudante',
      presentacion: '1 kg',
      categoria: 'Repostería',
      precio: '$\u00a01,30',
      precio_bs: 'Bs\u00a01.185,11',
      precio_antes: null,
      oferta: null,
      al_mayor: { minimo: 10, precio: '$\u00a01,10 c/u', precio_bs: 'Bs\u00a01.002,78 c/u' },
      disponible: true,
    });
  });

  it('con oferta: precio rebajado, precio de antes y porcentaje', () => {
    const [pasta] = resultado('buscar_productos', { texto: 'pasta' }).productos;
    expect(pasta).toMatchObject({ precio: '$\u00a01,44', precio_bs: 'Bs\u00a01.312,73', precio_antes: '$\u00a01,60', oferta: '10 %', al_mayor: null });
  });

  it('solo ofrece al mayor si ahorra frente al precio de oferta', () => {
    const [fondant] = resultado('buscar_productos', { texto: 'fondant' }).productos;
    expect(fondant).toMatchObject({ precio: '$\u00a05,78', oferta: '15 %', al_mayor: { minimo: 5, precio: '$\u00a05,50 c/u' } });
  });

  it('filtra por categoría', () => {
    const r = resultado('buscar_productos', { texto: '', categoria: 'bebidas' });
    expect(r.productos.map((p: { categoria: string }) => p.categoria)).toEqual(Array(r.productos.length).fill('Bebidas'));
    expect(r.encontrados).toBeGreaterThan(0);
  });

  it('devuelve como mucho 8 y dice cuántos hay en total', () => {
    const r = resultado('buscar_productos', { texto: '' });
    expect(r.productos).toHaveLength(8);
    expect(r.encontrados).toBe(catalogo.productos.length);
  });

  it('sin resultados lo dice, sin inventar nada', () => {
    expect(resultado('buscar_productos', { texto: 'caviar' })).toEqual({ encontrados: 0, productos: [] });
  });

  it('una categoría que no existe es un error con las categorías válidas', () => {
    const salida = ejecutar('buscar_productos', { texto: 'pan', categoria: 'joyeria' });
    expect(salida.error).toBe(true);
    expect(JSON.stringify(salida.resultado)).toContain('panaderia');
  });

  it('marca los agotados', () => {
    const [malta] = resultado('buscar_productos', { texto: 'malta' }, conAgotado).productos;
    expect(malta.disponible).toBe(false);
  });

  it.each([[{}], [{ texto: 5 }], [{ texto: 'x'.repeat(101) }], [null], ['harina']])('entrada inválida: %j', (entrada) => {
    expect(ejecutar('buscar_productos', entrada).error).toBe(true);
  });
});

describe('ver_producto', () => {
  it('da la ficha completa con la descripción', () => {
    const r = resultado('ver_producto', { slug: 'agua-mineral-1-5l' });
    expect(r.encontrado).toBe(true);
    expect(r.producto).toMatchObject({
      nombre: 'Agua mineral',
      presentacion: '1,5 L',
      precio: '$\u00a00,90',
      al_mayor: { minimo: 12, precio: '$\u00a00,75 c/u' },
    });
    expect(r.producto.descripcion.length).toBeGreaterThan(0);
  });

  it('un slug que no existe no es un error: dice que no está', () => {
    expect(resultado('ver_producto', { slug: 'caviar-beluga' })).toEqual({ encontrado: false });
  });

  it('entrada inválida', () => {
    expect(ejecutar('ver_producto', { slug: 'Harina De Trigo' }).error).toBe(true);
  });
});

describe('calcular_total', () => {
  it('suma con el precio de detal por debajo del mínimo al mayor', () => {
    expect(resultado('calcular_total', { items: [{ slug: 'harina-trigo-leudante-1kg', cantidad: 3 }] })).toEqual({
      lineas: [
        {
          slug: 'harina-trigo-leudante-1kg',
          nombre: 'Harina de trigo leudante',
          presentacion: '1 kg',
          cantidad: 3,
          precio_unitario: '$\u00a01,30',
          al_mayor: false,
          subtotal: '$\u00a03,90',
        },
      ],
      total: '$\u00a03,90',
      total_bs: 'Bs\u00a03.555,32',
      no_encontrados: [],
      agotados: [],
    });
  });

  it('aplica el precio al mayor desde el mínimo y junta las líneas repetidas', () => {
    const r = resultado('calcular_total', {
      items: [
        { slug: 'harina-trigo-leudante-1kg', cantidad: 6 },
        { slug: 'harina-trigo-leudante-1kg', cantidad: 4 },
        { slug: 'pasta-corta-1kg', cantidad: 2 },
      ],
    });
    expect(r.lineas).toHaveLength(2);
    expect(r.lineas[0]).toMatchObject({ cantidad: 10, precio_unitario: '$\u00a01,10', al_mayor: true, subtotal: '$\u00a011,00' });
    expect(r.lineas[1]).toMatchObject({ cantidad: 2, precio_unitario: '$\u00a01,44', subtotal: '$\u00a02,88' });
    expect(r.total).toBe('$\u00a013,88');
    expect(r.total_bs).toBe('Bs\u00a012.653,29');
  });

  it('separa los productos que no existen y los agotados, y no los suma', () => {
    const r = resultado(
      'calcular_total',
      {
        items: [
          { slug: 'malta-355ml', cantidad: 6 },
          { slug: 'caviar-beluga', cantidad: 1 },
          { slug: 'arroz-blanco-1kg', cantidad: 1 },
        ],
      },
      conAgotado,
    );
    expect(r.no_encontrados).toEqual(['caviar-beluga']);
    expect(r.agotados).toEqual(['malta-355ml']);
    expect(r.lineas.map((l: { slug: string }) => l.slug)).toEqual(['arroz-blanco-1kg']);
    expect(r.total).toBe('$\u00a01,25');
  });

  it('una suma que pasaría de 99 unidades por producto es un error', () => {
    expect(ejecutar('calcular_total', { items: [{ slug: 'malta-355ml', cantidad: 60 }, { slug: 'malta-355ml', cantidad: 60 }] }).error).toBe(true);
  });

  it.each([
    [{ items: [] }],
    [{ items: [{ slug: 'malta-355ml', cantidad: 0 }] }],
    [{ items: [{ slug: 'malta-355ml', cantidad: 100 }] }],
    [{ items: [{ slug: 'malta-355ml', cantidad: 1.5 }] }],
    [{ items: [{ slug: 'malta-355ml' }] }],
    [{ items: Array.from({ length: 51 }, () => ({ slug: 'malta-355ml', cantidad: 1 })) }],
    [{}],
  ])('entrada inválida: %j', (entrada) => {
    expect(ejecutar('calcular_total', entrada).error).toBe(true);
  });
});

describe('info_tienda', () => {
  it('da horario, dirección, tasa con su fecha, categorías, al mayor y cómo pedir', () => {
    const r = resultado('info_tienda', {});
    expect(r).toMatchObject({
      horario: catalogo.ajustes.horario,
      direccion: catalogo.ajustes.direccion,
      tasa: '$\u00a01 = Bs\u00a0911,62',
      tasa_fecha: '2026-11-14',
    });
    expect(r.categorias).toEqual(catalogo.categorias.map((c) => ({ slug: c.slug, nombre: c.nombre })));
    expect(r.aviso).toMatch(/ficticia/);
    expect(r.al_mayor.length).toBeGreaterThan(20);
    expect(r.como_pedir).toHaveLength(3);
  });
});

it('una herramienta que no existe es un error', () => {
  expect(ejecutar('borrar_catalogo', {}).error).toBe(true);
});

describe('contrato con price-guard', () => {
  it.each([
    ['buscar_productos', { texto: '' }],
    ['buscar_productos', { texto: 'fondant' }],
    ['ver_producto', { slug: 'agua-mineral-1-5l' }],
    ['calcular_total', { items: [{ slug: 'harina-trigo-leudante-1kg', cantidad: 12 }, { slug: 'refresco-cola-2l', cantidad: 3 }] }],
    ['info_tienda', {}],
  ])('repetir tal cual cualquier dato de %s pasa la comprobación', (nombre, entrada) => {
    const r = resultado(nombre, entrada);
    expect(cifrasNoConfirmadas(textos(r).join('\n'), [r])).toEqual([]);
  });
});
