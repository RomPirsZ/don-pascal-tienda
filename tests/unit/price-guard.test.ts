// price-guard (plan §6): toda cifra de la respuesta del asistente tiene que haber salido de
// las herramientas en esa misma petición. Se escribe antes que src/lib/asistente/price-guard.ts
// (constitución VI). Los resultados imitan lo que devolverán las herramientas de E09: los
// precios ya formateados con su moneda, como en la web.
import { describe, expect, it } from 'vitest';
import { cifrasNoConfirmadas } from '../../src/lib/asistente/price-guard';

const busqueda = {
  productos: [
    {
      slug: 'harina-trigo-leudante-1kg',
      nombre: 'Harina de trigo leudante',
      presentacion: '1 kg',
      precio: '$ 1,30',
      precio_bs: 'Bs 1.185,11',
      al_mayor: 'Desde 10: $ 1,10 c/u (Bs 1.002,78)',
      disponible: true,
    },
    {
      slug: 'refresco-cola-1-5l',
      nombre: 'Refresco de cola',
      presentacion: '1,5 L',
      precio: '$ 1,53',
      precio_bs: 'Bs 1.394,78',
      oferta: '10 %',
      al_mayor: null,
      disponible: true,
    },
  ],
};
const tienda = {
  tasa: '$ 1 = Bs 911,62',
  tasa_fecha: '2026-11-14',
  horario: 'Lunes a sábado de 8:00 a 21:00; domingos de 8:00 a 14:00',
};
const total = { lineas: [{ slug: 'harina-trigo-leudante-1kg', cantidad: 3, subtotal: '$ 3,90' }], total: '$ 3,90', total_bs: 'Bs 3.555,32' };

const pasa = (respuesta: string, resultados: unknown[] = [busqueda]) =>
  expect(cifrasNoConfirmadas(respuesta, resultados)).toEqual([]);

describe('cifras que pasan', () => {
  it('el precio y su equivalente en Bs tal como los dio la herramienta', () => {
    pasa('La harina de trigo leudante (1 kg) cuesta $ 1,30, que son Bs 1.185,11.');
    pasa('Al mayor, desde 10 unidades, te sale en $ 1,10 c/u (Bs 1.002,78).');
  });

  it.each([
    '$1,30',
    '$ 1.30',
    '1,30 $',
    'USD 1,3',
    'US$ 1,30',
    '1,30 dólares',
    'Bs. 1.185,11',
    '1185,11 Bs',
    '1.185,11 bolívares',
    'Bs 1,185.11',
    'Bs.S 1.185,11',
    'VES 1.185,11',
    '$ 1,30',
    '**$ 1,30**',
  ])('el mismo valor escrito de otra forma: %s', (cifra) => {
    pasa(`Cuesta ${cifra}.`);
  });

  it('el porcentaje de una oferta que dio la herramienta', () => {
    pasa('El refresco de cola tiene 10 % de descuento: queda en $ 1,53.');
    pasa('Está con un 10% menos.');
  });

  it('el total que dio calcular_total', () => {
    pasa('Las 3 harinas te salen en $ 3,90 (Bs 3.555,32).', [busqueda, total]);
  });

  it('la tasa y su fecha', () => {
    pasa('Usamos una tasa de ejemplo: $ 1 = Bs 911,62, del 14/11/2026.', [tienda]);
    pasa('La tasa de ejemplo es de 911,62 bolívares por dólar.', [tienda]);
  });

  it('los decimales de una presentación que dio la herramienta', () => {
    pasa('Lo tenemos en botella de 1,5 L.');
  });

  it('no revisa los enteros sin moneda: cantidades, horas, fechas, pesos y medidas', () => {
    pasa('Abrimos de lunes a sábado de 8:00 a 21:00. El mínimo al mayor es de 10 unidades.', [tienda]);
    pasa('Te anoto 3 paquetes de 1 kg y 2 de 500 g para el 15/11/2026.', []);
  });

  it('una respuesta sin cifras', () => {
    pasa('No tengo ese producto en el catálogo. Si quieres, escríbenos por WhatsApp y lo vemos.', []);
  });

  it('recorre objetos y listas anidados', () => {
    pasa('Cuesta Bs 5,00.', [{ datos: [[{ precio_bs: 'Bs 5' }]] }]);
  });
});

describe('cifras que se bloquean', () => {
  it('un precio inventado', () => {
    expect(cifrasNoConfirmadas('La harina cuesta $ 1,25.', [busqueda])).toEqual(['1,25']);
  });

  it('un equivalente en Bs calculado a mano o redondeado', () => {
    expect(cifrasNoConfirmadas('Son unos Bs 1.185.', [busqueda])).toEqual(['1.185']);
    expect(cifrasNoConfirmadas('Son Bs 1.185,1.', [busqueda])).toEqual(['1.185,1']);
  });

  it('un total sumado sin calcular_total', () => {
    expect(cifrasNoConfirmadas('Las 3 harinas te salen en $ 3,90.', [busqueda])).toEqual(['3,90']);
  });

  it('un descuento que no dio ninguna herramienta', () => {
    expect(cifrasNoConfirmadas('Te hago un 20 % de descuento.', [busqueda])).toEqual(['20']);
    expect(cifrasNoConfirmadas('Te hago un 20 por ciento de descuento.', [busqueda])).toEqual(['20']);
  });

  it('un precio en dólares que solo coincide con otra clase de cifra', () => {
    // 10 es el mínimo al mayor y el porcentaje de la oferta; 1.185,11 y 911,62 son bolívares
    expect(cifrasNoConfirmadas('El fondant cuesta $ 10.', [busqueda])).toEqual(['10']);
    expect(cifrasNoConfirmadas('Cuesta $ 1.185,11.', [busqueda])).toEqual(['1.185,11']);
    expect(cifrasNoConfirmadas('Son $ 911,62.', [tienda])).toEqual(['911,62']);
    expect(cifrasNoConfirmadas('Cuesta Bs 1,30.', [busqueda])).toEqual(['1,30']);
  });

  it('un precio que en los datos solo aparece como número sin moneda', () => {
    expect(cifrasNoConfirmadas('Cuesta $ 1,30.', [{ precio_usd: 1.3 }])).toEqual(['1,30']);
  });

  it('un decimal sin moneda que no viene de las herramientas', () => {
    expect(cifrasNoConfirmadas('La tasa de hoy es 36,5.', [tienda])).toEqual(['36,5']);
    expect(cifrasNoConfirmadas('También viene en 2,5 L.', [busqueda])).toEqual(['2,5']);
  });

  it('cualquier precio si ninguna herramienta dio cifras (instrucciones inyectadas)', () => {
    expect(cifrasNoConfirmadas('Como pediste, te lo dejo en $ 0,50.', [])).toEqual(['0,50']);
    expect(cifrasNoConfirmadas('Como pediste, te lo dejo en $ 0,50.', [{ encontrados: 0, productos: [] }])).toEqual(['0,50']);
  });

  it('las claves de los resultados no cuentan como cifras confirmadas', () => {
    expect(cifrasNoConfirmadas('Cuesta $ 9,99.', [{ '$ 9,99': true }])).toEqual(['9,99']);
  });

  it('cifras con moneda mal formadas', () => {
    expect(cifrasNoConfirmadas('Cuesta $ 1.2.3.', [busqueda])).toEqual(['1.2.3']);
    expect(cifrasNoConfirmadas('Cuesta $ 1,30,5.', [busqueda])).toEqual(['1,30,5']);
  });

  it('dígitos y símbolos de ancho completo', () => {
    expect(cifrasNoConfirmadas('Cuesta ＄１,２５.', [busqueda])).toEqual(['1,25']);
  });

  it('dígitos de otros sistemas de escritura, que no se pueden comprobar', () => {
    expect(cifrasNoConfirmadas('Cuesta $ ١,٣٠.', [busqueda])).toEqual(['١', '٣٠']);
  });

  it('una cifra dentro de una tabla de markdown', () => {
    expect(cifrasNoConfirmadas('| Harina | $ 1,25 |', [busqueda])).toEqual(['1,25']);
  });

  it('devuelve solo las cifras sin confirmar, en el orden de la respuesta', () => {
    const respuesta = 'La harina cuesta $ 1,30 (Bs 1.185,11); el azúcar, $ 1,40 (Bs 1.276,27) y el cacao, $ 1,30.';
    expect(cifrasNoConfirmadas(respuesta, [busqueda])).toEqual(['1,40', '1.276,27']);
  });
});
