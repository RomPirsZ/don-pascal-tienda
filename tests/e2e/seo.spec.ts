// e2e: buscadores y vista previa al compartir (E17, spec §9).
import { test, expect, type Page } from '@playwright/test';
import { SITE_URL } from '../../src/lib/sitio';

const meta = (page: Page, selector: string) => page.locator(selector).getAttribute('content');

for (const ruta of ['/', '/productos/', '/productos/fondant-blanco-1kg/']) {
  test(`${ruta}: descripción, canonical, Open Graph y X`, async ({ page, request }) => {
    await page.goto(ruta);
    const descripcion = await meta(page, 'meta[name="description"]');
    expect(descripcion?.length).toBeGreaterThan(50);
    expect(descripcion!.length).toBeLessThanOrEqual(160);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_URL}${ruta}`);
    expect(await meta(page, 'meta[property="og:title"]')).toBe(await page.title());
    expect(await meta(page, 'meta[property="og:description"]')).toBe(descripcion);
    expect(await meta(page, 'meta[property="og:url"]')).toBe(`${SITE_URL}${ruta}`);
    expect(await meta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');

    // La imagen es absoluta, existe y es la de 1200 × 630
    const imagen = await meta(page, 'meta[property="og:image"]');
    expect(imagen).toMatch(new RegExp(`^${SITE_URL}/og/`));
    const respuesta = await request.get(new URL(imagen!).pathname);
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()['content-type']).toBe('image/jpeg');
    expect(await meta(page, 'meta[property="og:image:width"]')).toBe('1200');
    expect(await meta(page, 'meta[property="og:image:height"]')).toBe('630');
  });
}

test('la 404 no se indexa ni declara canonical', async ({ page }) => {
  await page.goto('/no-existe/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
