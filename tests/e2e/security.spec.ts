// Seguridad (constitución V, plan §8). Adaptado de tests/e2e/security.spec.ts del portafolio.
import { test, expect, type APIResponse } from '@playwright/test';
import { CSP as csp, HEADER_RULES, SECURITY_HEADERS as headers } from './headers';

function expectSecurityHeaders(response: APIResponse, what: string) {
  const received = response.headers();
  for (const [key, value] of Object.entries(headers)) expect(received[key.toLowerCase()], `${what}: ${key}`).toBe(value);
}

test('_headers define las cabeceras del plan para todo el sitio', () => {
  for (const key of [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'X-Frame-Options',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
    'X-Permitted-Cross-Domain-Policies',
  ]) {
    expect(headers[key], key).toBeTruthy();
  }
  expect(HEADER_RULES.map((rule) => rule.path)).toEqual(['/*']);
});

test('el servidor envía las cabeceras en páginas y en el 404', async ({ request }) => {
  const inicio = await request.get('/');
  expect(inicio.status()).toBe(200);
  expectSecurityHeaders(inicio, '/');
  const noExiste = await request.get('/no-existe');
  expect(noExiste.status()).toBe(404);
  expectSecurityHeaders(noExiste, '/no-existe');
});

// Las cabeceras de lo que genera el Worker (src/middleware.ts) se prueban con la primera ruta de
// servidor, /api/chat (E10): hasta entonces todo el sitio es estático y el Worker no responde nada.

test('la CSP no abre puertas: sin unsafe-*, sin comodines, sin plugins ni <base>', () => {
  expect(csp).not.toMatch(/'unsafe-(inline|eval|hashes)'|'strict-dynamic'|\*/);
  for (const directive of ["default-src 'self'", "script-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'"]) {
    expect(csp).toContain(directive);
  }
});

test('el HTML no lleva scripts ni estilos inline que la CSP bloquearía', async ({ page }) => {
  const violaciones: string[] = [];
  page.on('console', (mensaje) => /Content Security Policy/i.test(mensaje.text()) && violaciones.push(mensaje.text()));
  await page.goto('/');
  expect(await page.locator('script:not([src]):not([type="application/ld+json"]):not([type="application/json"])').count()).toBe(0);
  expect(violaciones).toEqual([]);
});
