import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// wrangler.jsonc admite comentarios; en este archivo todos ocupan su propia línea
const config = JSON.parse(
  readFileSync('wrangler.jsonc', 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n'),
);

describe('wrangler.jsonc', () => {
  // Como en el portafolio (auditoría 2026-11-10): los logs de invocación guardan la URL, las cabeceras y la IP de cada
  // petición (los logs nunca llevan la IP ni lo que escribe el cliente) y gastan el cupo diario de eventos
  it('guarda los logs del Worker sin los de invocación', () => {
    expect(config.observability).toEqual({ enabled: true, logs: { invocation_logs: false } });
  });
});

describe('wrangler.jsonc de la tienda', () => {
  // Las URL de vista previa de cada versión serían públicas y conservarían los secretos con que
  // se subieron (riesgo aceptado en el portafolio): aquí no hacen falta
  it('sin URL de vista previa por versión', () => {
    expect(config.preview_urls).toBe(false);
  });
});
