// e2e 3: añadir al carrito, cambiar cantidades y preparar el pedido. Sin número de WhatsApp en
// el build de pruebas, así que el carrito está en modo «Copiar pedido».
import { test, expect, type Page } from '@playwright/test';

const abrirCarrito = (page: Page) => page.getByRole('button', { name: /^Carrito \d+ unidad(es)?$/ }).click();
const carrito = (page: Page) => page.getByRole('dialog', { name: 'Tu pedido' });

test('añadir desde una tarjeta, cambiar cantidades y vaciar', async ({ page }) => {
  await page.goto('/productos/?categoria=viveres');
  await page.getByRole('button', { name: 'Añadir Harina de maíz precocida al carrito' }).click();
  await expect(page.getByRole('button', { name: 'Carrito 1 unidad' })).toBeVisible();

  await abrirCarrito(page);
  const panel = carrito(page);
  await expect(panel.getByText('Harina de maíz precocida', { exact: true })).toBeVisible();
  await expect(panel.getByText('$ 1,15').first()).toBeVisible();

  await panel.getByRole('button', { name: 'Añadir una unidad de Harina de maíz precocida' }).click();
  await expect(panel.getByText('2 unidades')).toBeVisible();
  await expect(panel.getByText('$ 2,30').first()).toBeVisible();

  await panel.getByRole('button', { name: 'Quitar una unidad de Harina de maíz precocida' }).click();
  await panel.getByRole('button', { name: 'Quitar una unidad de Harina de maíz precocida' }).click();
  await expect(panel.getByText('Tu carrito está vacío')).toBeVisible();
});

test('desde el mínimo se aplica el precio al mayor y el mensaje lo dice', async ({ page }) => {
  await page.goto('/productos/harina-maiz-1kg/');
  await page.evaluate(() => localStorage.setItem('don-pascal:carrito', JSON.stringify([{ slug: 'harina-maiz-1kg', cantidad: 19 }])));
  await page.reload();
  await page.getByRole('button', { name: 'Añadir al carrito' }).click();
  await abrirCarrito(page);
  const panel = carrito(page);
  await expect(panel.getByText('Precio al mayor')).toBeVisible();
  await expect(panel.getByText('$ 19,60').first()).toBeVisible();
  await expect(panel.locator('[data-carrito-mensaje]')).toContainText('• 20 × Harina de maíz precocida (1 kg), al mayor: $ 19,60');
  await expect(panel.locator('[data-carrito-mensaje]')).toContainText('Total: $ 19,60');
});

test('el carrito se conserva al recargar y descarta datos manipulados', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem(
      'don-pascal:carrito',
      JSON.stringify([{ slug: 'cafe-molido-500g', cantidad: 2 }, { slug: '<img src=x onerror=alert(1)>', cantidad: 1 }, { slug: 'no-existe', cantidad: 3 }]),
    ),
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'Carrito 2 unidades' })).toBeVisible();
  await abrirCarrito(page);
  await expect(carrito(page).getByText('Café molido', { exact: true })).toBeVisible();
  await expect(carrito(page).locator('img[src*="onerror"]')).toHaveCount(0);
});

test('por teclado: abre, se recorre y se cierra con Esc devolviendo el foco', async ({ page }) => {
  await page.goto('/productos/cafe-molido-500g/');
  await page.getByRole('button', { name: 'Añadir al carrito' }).click();
  const abrir = page.getByRole('button', { name: 'Carrito 1 unidad' });
  await abrir.focus();
  await page.keyboard.press('Enter');
  await expect(carrito(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(carrito(page)).toBeHidden();
  await expect(abrir).toBeFocused();
});

test('copiar el pedido cuando no hay número de WhatsApp', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'permisos del portapapeles');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/productos/sal-1kg/');
  await page.getByRole('button', { name: 'Añadir al carrito' }).click();
  await abrirCarrito(page);
  await expect(carrito(page).getByRole('link', { name: 'Enviar pedido por WhatsApp' })).toBeHidden();
  await carrito(page).getByRole('button', { name: 'Copiar pedido' }).click();
  await expect(carrito(page).getByRole('status')).toHaveText('Pedido copiado. Pégalo en el chat de la tienda.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('• 1 × Sal refinada (1 kg): $ 0,70');
});
