// Accesibilidad (constitución III): axe sin violaciones serias ni críticas, también con el
// carrito abierto.
import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

async function sinViolacionesSerias(page: Page, que: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), que).toEqual([]);
}

for (const ruta of ['/', '/productos/', '/productos/?q=iphone', '/productos/fondant-blanco-1kg/', '/productos/no-existe/', '/no-existe/']) {
  test(`axe: ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    await sinViolacionesSerias(page, ruta);
  });
}

test('axe: carrito abierto con productos', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('don-pascal:carrito', JSON.stringify([{ slug: 'harina-maiz-1kg', cantidad: 20 }, { slug: 'sal-1kg', cantidad: 1 }])));
  await page.reload();
  await page.getByRole('button', { name: /^Carrito/ }).click();
  await expect(page.getByRole('dialog', { name: 'Tu pedido' })).toBeVisible();
  await sinViolacionesSerias(page, 'carrito');
});
