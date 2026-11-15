import { test, expect } from '@playwright/test';

test('el inicio carga en español con el aviso de concepto', async ({ page }) => {
  const errores: string[] = [];
  page.on('console', (mensaje) => mensaje.type() === 'error' && errores.push(mensaje.text()));
  page.on('pageerror', (error) => errores.push(error.message));

  const respuesta = await page.goto('/');
  expect(respuesta?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/Tienda ficticia/)).toBeVisible();
  // Los precios se ven en dólares y en bolívares
  await expect(page.getByText(/^\$\s\d+,\d{2}$/).first()).toBeVisible();
  await expect(page.getByText(/^Bs\s[\d.]+,\d{2}$/).first()).toBeVisible();
  expect(errores).toEqual([]);
});

test('la 404 lleva de vuelta al inicio', async ({ page }) => {
  const respuesta = await page.goto('/no-existe/');
  expect(respuesta?.status()).toBe(404);
  await page.getByRole('link', { name: 'Volver al inicio' }).click();
  await expect(page).toHaveURL('/');
});
