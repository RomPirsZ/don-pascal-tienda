import { describe, expect, it } from 'vitest';
import { PAGE_SECURITY_HEADERS, SERVER_SECURITY_HEADERS, withSecurityHeaders } from '../../src/lib/server-headers';

describe('withSecurityHeaders', () => {
  it('añade las cabeceras que faltan y conserva estado, cuerpo y las demás cabeceras', async () => {
    const original = new Response('<svg/>', {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' },
    });
    const response = withSecurityHeaders(original);

    for (const [name, value] of Object.entries(SERVER_SECURITY_HEADERS)) expect(response.headers.get(name), name).toBe(value);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000');
    expect(await response.text()).toBe('<svg/>');
  });

  it('no pisa una cabecera que la respuesta ya trae', () => {
    const response = withSecurityHeaders(new Response(null, { status: 303, headers: { 'X-Frame-Options': 'SAMEORIGIN', Location: '/gracias/' } }));
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('location')).toBe('/gracias/');
    expect(response.status).toBe(303);
  });

  it('devuelve una respuesta nueva: no modifica la original', () => {
    const original = new Response('x');
    expect(withSecurityHeaders(original)).not.toBe(original);
    expect(original.headers.has('x-content-type-options')).toBe(false);
  });
});

describe('páginas generadas por el Worker', () => {
  it('las páginas HTML reciben las cabeceras de public/_headers', () => {
    const response = withSecurityHeaders(new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    for (const [name, value] of Object.entries(PAGE_SECURITY_HEADERS)) expect(response.headers.get(name), name).toBe(value);
  });

  it('PAGE_SECURITY_HEADERS es exactamente la regla /* de public/_headers', async () => {
    const { readFileSync } = await import('node:fs');
    const lineas = readFileSync('public/_headers', 'utf8').split('\n').filter((l) => /^\s+\S/.test(l) && !l.trimStart().startsWith('#'));
    const reglas = Object.fromEntries(lineas.map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]));
    expect(reglas).toEqual(PAGE_SECURITY_HEADERS);
  });
});
