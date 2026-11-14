// e2e 7: sin JavaScript se lee todo y no quedan controles que no funcionan (constitución I).
import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

for (const ruta of ['/', '/productos/', '/productos/harina-maiz-1kg/']) {
  test(`sin JS: ${ruta} se lee y no muestra el carrito`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/^\$ \d+,\d{2}$/).first()).toBeVisible();
    // El carrito y «Añadir» necesitan JS: sin él no aparecen
    await expect(page.getByRole('button', { name: /^Carrito/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Añadir/ })).toHaveCount(0);
  });
}
