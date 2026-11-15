import { describe, expect, it } from 'vitest';
import { enlaceWhatsApp, mensajeProducto, numeroTienda } from '../../src/lib/whatsapp';

describe('numeroTienda', () => {
  it('se queda solo con los dígitos', () => {
    expect(numeroTienda('+58 412-555 0000')).toBe('584125550000');
  });
  it('vacío o demasiado corto: no hay número', () => {
    expect(numeroTienda('')).toBeNull();
    expect(numeroTienda(undefined)).toBeNull();
    expect(numeroTienda('12345')).toBeNull();
  });
});

describe('enlaceWhatsApp', () => {
  it('abre el chat de la tienda con el texto codificado', () => {
    expect(enlaceWhatsApp('Hola, ¿tienen café?', '584125550000')).toBe('https://wa.me/584125550000?text=Hola%2C%20%C2%BFtienen%20caf%C3%A9%3F');
  });
  it('sin número no hay enlace', () => {
    expect(enlaceWhatsApp('Hola', null)).toBeNull();
  });
});

describe('mensajeProducto', () => {
  it('lleva el producto, la presentación, el precio en $ y Bs y el aviso de ejemplo', () => {
    const texto = mensajeProducto(
      { nombre: 'Harina de maíz precocida', presentacion: '1 kg', precioUsd: 1.15, precioMayorUsd: 0.98, minimoMayor: 20, ofertaPct: null },
      236.4,
    );
    expect(texto).toBe('Hola, Don Pascal. Quiero pedir 1 × Harina de maíz precocida (1 kg): $\u00a01,15 / Bs\u00a0271,86. (Precios de ejemplo.)');
  });
});
