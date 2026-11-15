// Descripciones para buscadores y vistas previas (E17): ninguna pasa de 160 caracteres.
import { describe, expect, it } from 'vitest';
import { CATALOGO_EJEMPLO } from '../../src/data/catalogo-ejemplo';
import { t } from '../../src/i18n';
import { descripcionFicha } from '../../src/lib/meta';
import { LARGO_DESCRIPCION, SITE_URL } from '../../src/lib/sitio';

const tasa = CATALOGO_EJEMPLO.ajustes.tasaBcv;

describe('descripciones', () => {
  it('las del inicio y el catálogo caben', () => {
    expect(t('sitio.descripcion').length).toBeLessThanOrEqual(LARGO_DESCRIPCION);
    expect(t('catalogo.descripcion').length).toBeLessThanOrEqual(LARGO_DESCRIPCION);
  });

  it('la de cada ficha cabe y lleva su precio y el aviso de ejemplo', () => {
    for (const p of CATALOGO_EJEMPLO.productos) {
      const d = descripcionFicha(p, tasa);
      expect(d.length, p.slug).toBeLessThanOrEqual(LARGO_DESCRIPCION);
      expect(d).toContain(p.nombre);
      expect(d).toMatch(/\$\s\d/);
      expect(d).toContain('tienda ficticia');
    }
  });

  it('con una descripción larga, la omite antes que pasarse', () => {
    const [primero] = CATALOGO_EJEMPLO.productos;
    const largo = { ...primero!, descripcion: 'Una descripción muy larga '.repeat(8) };
    const d = descripcionFicha(largo, tasa);
    expect(d.length).toBeLessThanOrEqual(LARGO_DESCRIPCION);
    expect(d).not.toContain('muy larga');
  });

  it('la URL pública es absoluta y sin barra final', () => {
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
  });
});
