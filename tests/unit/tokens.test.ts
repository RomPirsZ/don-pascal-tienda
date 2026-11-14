// Contraste de los tokens de color (constitución III, plan §1). Cada par que la tienda usa
// como texto sobre fondo llega a AA (4,5:1); los textos grandes y los gráficos, a 3:1.
// Adaptado de tests/unit/tokens.test.ts del restaurante.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Con fs y no con ?raw: Vitest entrega vacío el CSS importado si no se configura aparte
const css = readFileSync('src/styles/global.css', 'utf8');

const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
const t: Record<string, string> = Object.fromEntries(
  [...root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]),
);

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('tokens de color', () => {
  it('define todos los roles del contrato', () => {
    expect(Object.keys(t).sort()).toEqual(
      [
        'aji', 'aji-texto', 'hoja', 'hoja-texto', 'linea', 'maiz', 'monte', 'monte-claro',
        'papel', 'pradera', 'sobre-monte-suave', 'superficie', 'tinta', 'tinta-suave',
      ].sort(),
    );
  });

  it.each([
    // Texto sobre los suelos claros
    ['tinta', 'papel'],
    ['tinta', 'superficie'],
    ['tinta', 'pradera'],
    ['tinta-suave', 'papel'],
    ['tinta-suave', 'superficie'],
    ['tinta-suave', 'pradera'],
    ['hoja-texto', 'papel'],
    ['hoja-texto', 'superficie'],
    ['aji-texto', 'papel'],
    ['monte', 'pradera'],
    // Texto sobre el monte
    ['papel', 'monte'],
    ['sobre-monte-suave', 'monte'],
    ['maiz', 'monte'],
    ['papel', 'monte-claro'],
    // Texto en tinta sobre los rellenos de color
    ['tinta', 'maiz'],
    ['tinta', 'aji'],
    ['tinta', 'hoja'],
  ])('%s sobre %s cumple AA (4,5:1)', (texto, fondo) => {
    expect(contrast(t[texto]!, t[fondo]!)).toBeGreaterThanOrEqual(4.5);
  });

  it('los bordes de los controles (tinta suave) se distinguen del papel (3:1)', () => {
    expect(contrast(t['tinta-suave']!, t['papel']!)).toBeGreaterThanOrEqual(3);
  });

  it('los anillos de foco se ven: monte sobre lo claro y maíz sobre el monte (3:1)', () => {
    for (const fondo of ['papel', 'superficie', 'pradera', 'maiz', 'hoja']) {
      expect(contrast(t['monte']!, t[fondo]!), `monte sobre ${fondo}`).toBeGreaterThanOrEqual(3);
    }
    for (const fondo of ['monte', 'monte-claro']) {
      expect(contrast(t['maiz']!, t[fondo]!), `maíz sobre ${fondo}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('ningún componente usa un hex propio: los colores salen de los tokens', () => {
    const fuera = css.replace(/:root\s*\{[^}]*\}/, '').match(/#[0-9a-f]{3,8}\b/gi) ?? [];
    expect(fuera).toEqual([]);
  });
});
