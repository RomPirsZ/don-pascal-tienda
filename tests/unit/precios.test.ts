// Precios (plan §5): todo en centavos enteros, una sola fórmula para la web, el carrito y el
// asistente. Se escribe antes que src/lib/precios.ts (constitución VI).
import { describe, expect, it } from 'vitest';
import {
  aCentavos,
  bolivares,
  formatoBs,
  formatoUsd,
  precioUnitario,
  subtotal,
  tieneMayor,
} from '../../src/lib/precios';

const harina = { precioUsd: 1.15, precioMayorUsd: 0.98, minimoMayor: 20, ofertaPct: null };
const fondant = { precioUsd: 6.8, precioMayorUsd: 6.0, minimoMayor: 5, ofertaPct: 15 };
const pasta = { precioUsd: 1.6, precioMayorUsd: null, minimoMayor: null, ofertaPct: 10 };
const sal = { precioUsd: 0.7, precioMayorUsd: null, minimoMayor: null, ofertaPct: null };

describe('aCentavos', () => {
  it('convierte sin errores de coma flotante', () => {
    expect(aCentavos(1.15)).toBe(115);
    expect(aCentavos(0.7)).toBe(70);
    expect(aCentavos(4.9)).toBe(490);
    expect(aCentavos(1.005)).toBe(101);
  });
});

describe('precioUnitario', () => {
  it('sin oferta ni mayor es el precio de lista', () => {
    expect(precioUnitario(sal)).toBe(70);
    expect(precioUnitario(sal, 50)).toBe(70);
  });

  it('aplica la oferta redondeando al centavo', () => {
    // 160 × 0,90 = 144
    expect(precioUnitario(pasta)).toBe(144);
    // 680 × 0,85 = 578
    expect(precioUnitario(fondant)).toBe(578);
  });

  it('al mayor solo desde el mínimo', () => {
    expect(precioUnitario(harina, 19)).toBe(115);
    expect(precioUnitario(harina, 20)).toBe(98);
    expect(precioUnitario(harina, 100)).toBe(98);
  });

  it('con oferta y mayor, el más bajo de los dos', () => {
    expect(precioUnitario(fondant, 4)).toBe(578);
    expect(precioUnitario(fondant, 5)).toBe(578);
    const fondantMuyBarato = { ...fondant, precioMayorUsd: 5.5 };
    expect(precioUnitario(fondantMuyBarato, 5)).toBe(550);
  });

  it('rechaza cantidades que no son enteros positivos', () => {
    for (const cantidad of [0, -1, 1.5, Number.NaN]) expect(() => precioUnitario(sal, cantidad)).toThrow();
  });
});

describe('subtotal', () => {
  it('multiplica el precio unitario que toca por la cantidad', () => {
    expect(subtotal(harina, 3)).toBe(345);
    expect(subtotal(harina, 20)).toBe(1960);
    expect(subtotal(pasta, 2)).toBe(288);
  });
});

describe('bolivares', () => {
  it('convierte con la tasa y redondea al céntimo', () => {
    // 1,15 × 236,40 = 271,86
    expect(bolivares(115, 236.4)).toBe(27186);
    // 0,70 × 236,40 = 165,48
    expect(bolivares(70, 236.4)).toBe(16548);
    // tasa con 4 decimales: 1,44 × 236,4567 = 340,4976… → 340,50
    expect(bolivares(144, 236.4567)).toBe(34050);
  });

  it('rechaza una tasa que no es positiva', () => {
    for (const tasa of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => bolivares(100, tasa)).toThrow();
  });
});

describe('formato es-VE', () => {
  it('dólares con coma decimal y punto de miles', () => {
    expect(formatoUsd(115)).toBe('$ 1,15');
    expect(formatoUsd(123456)).toBe('$ 1.234,56');
    expect(formatoUsd(70)).toBe('$ 0,70');
  });

  it('bolívares igual, con «Bs»', () => {
    expect(formatoBs(27186)).toBe('Bs 271,86');
    expect(formatoBs(1234567)).toBe('Bs 12.345,67');
  });
});

describe('tieneMayor', () => {
  it('solo si hay precio y mínimo', () => {
    expect(tieneMayor(harina)).toBe(true);
    expect(tieneMayor(sal)).toBe(false);
  });
});
