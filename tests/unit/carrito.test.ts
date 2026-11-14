// Carrito (plan §5): se escribe antes que src/lib/carrito.ts (constitución VI). Lo guardado en
// el navegador no es de fiar: se valida, y los precios se recalculan siempre con el catálogo.
import { describe, expect, it } from 'vitest';
import { CATALOGO_EJEMPLO } from '../../src/data/catalogo-ejemplo';
import { anadir, CANTIDAD_MAXIMA, fijarCantidad, LINEAS_MAXIMAS, mensajePedido, normalizar, quitar, resumir } from '../../src/lib/carrito';

const productos = CATALOGO_EJEMPLO.productos;
const tasa = 911.62;

describe('normalizar (lo leído de localStorage)', () => {
  it('acepta un carrito válido', () => {
    expect(normalizar([{ slug: 'sal-1kg', cantidad: 2 }])).toEqual([{ slug: 'sal-1kg', cantidad: 2 }]);
  });

  it('descarta lo que no tiene la forma esperada', () => {
    expect(normalizar(null)).toEqual([]);
    expect(normalizar('{"slug":"x"}')).toEqual([]);
    expect(normalizar([{ slug: '<img src=x>', cantidad: 1 }, { slug: 'sal-1kg', cantidad: 'muchas' }, { slug: 'sal-1kg', cantidad: 1.5 }, { slug: 'sal-1kg', cantidad: -3 }])).toEqual([]);
  });

  it('une repetidos, limita la cantidad y el número de líneas', () => {
    expect(normalizar([{ slug: 'sal-1kg', cantidad: 60 }, { slug: 'sal-1kg', cantidad: 60 }])).toEqual([{ slug: 'sal-1kg', cantidad: CANTIDAD_MAXIMA }]);
    const muchas = Array.from({ length: 80 }, (_, i) => ({ slug: `producto-${i}`, cantidad: 1 }));
    expect(normalizar(muchas)).toHaveLength(LINEAS_MAXIMAS);
  });
});

describe('cambios en el carrito', () => {
  it('añadir suma a la línea existente sin pasar del máximo', () => {
    let lineas = anadir([], 'sal-1kg');
    lineas = anadir(lineas, 'sal-1kg', 2);
    expect(lineas).toEqual([{ slug: 'sal-1kg', cantidad: 3 }]);
    expect(anadir([{ slug: 'sal-1kg', cantidad: 98 }], 'sal-1kg', 5)).toEqual([{ slug: 'sal-1kg', cantidad: CANTIDAD_MAXIMA }]);
  });

  it('fijar la cantidad a cero quita la línea', () => {
    expect(fijarCantidad([{ slug: 'sal-1kg', cantidad: 3 }], 'sal-1kg', 0)).toEqual([]);
    expect(fijarCantidad([{ slug: 'sal-1kg', cantidad: 3 }], 'sal-1kg', 150)).toEqual([{ slug: 'sal-1kg', cantidad: CANTIDAD_MAXIMA }]);
  });

  it('quitar elimina solo esa línea', () => {
    expect(quitar([{ slug: 'sal-1kg', cantidad: 1 }, { slug: 'cloro-1l', cantidad: 2 }], 'sal-1kg')).toEqual([{ slug: 'cloro-1l', cantidad: 2 }]);
  });
});

describe('resumir', () => {
  it('calcula subtotales y total con el precio del catálogo', () => {
    const r = resumir([{ slug: 'harina-maiz-1kg', cantidad: 3 }, { slug: 'pasta-corta-1kg', cantidad: 2 }], productos, tasa);
    // 3 × 1,15 + 2 × 1,44 (oferta del 10 %)
    expect(r.items.map((i) => i.subtotal)).toEqual([345, 288]);
    expect(r.total).toBe(633);
    expect(r.totalBs).toBe(Math.round(633 * tasa));
    expect(r.unidades).toBe(5);
  });

  it('aplica el precio al mayor desde el mínimo y lo marca', () => {
    const r = resumir([{ slug: 'harina-maiz-1kg', cantidad: 20 }], productos, tasa);
    expect(r.items[0]).toMatchObject({ unitario: 98, subtotal: 1960, alMayor: true });
  });

  it('omite productos que ya no existen o están agotados', () => {
    const agotado = productos.map((p) => (p.slug === 'sal-1kg' ? { ...p, disponible: false } : p));
    const r = resumir([{ slug: 'sal-1kg', cantidad: 1 }, { slug: 'no-existe', cantidad: 1 }, { slug: 'cloro-1l', cantidad: 1 }], agotado, tasa);
    expect(r.items.map((i) => i.producto.slug)).toEqual(['cloro-1l']);
    expect(r.omitidos).toEqual(['sal-1kg', 'no-existe']);
  });
});

describe('mensajePedido', () => {
  it('lista cada producto con cantidad y subtotal, y el total en $ y Bs con la tasa', () => {
    const r = resumir([{ slug: 'harina-maiz-1kg', cantidad: 20 }, { slug: 'cafe-molido-500g', cantidad: 1 }], productos, tasa);
    expect(mensajePedido(r, { tasa, tasaFecha: '2026-11-14' })).toBe(
      [
        'Hola, Don Pascal. Quiero hacer este pedido:',
        '• 20 × Harina de maíz precocida (1 kg), al mayor: $ 19,60',
        '• 1 × Café molido (500 g): $ 4,90',
        'Total: $ 24,50 (Bs 22.334,69)',
        'Tasa de ejemplo: Bs 911,62 por dólar (14/11/2026). Precios de ejemplo.',
      ].join('\n'),
    );
  });
});
