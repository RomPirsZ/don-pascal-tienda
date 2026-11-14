// e2e 2 (buscar y filtrar, también sin JS) y 4 (ficha y volver). Con el catálogo de ejemplo.
import { test, expect } from '@playwright/test';

test('buscar desde el inicio lleva a los resultados', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar un producto' }).fill('harina');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page).toHaveURL(/\/productos\/\?.*q=harina/);
  await expect(page.getByRole('heading', { level: 1, name: 'Resultados para «harina»' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Harina de maíz precocida' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Harina de trigo leudante' })).toBeVisible();
});

test('filtrar por categoría y solo al mayor', async ({ page }) => {
  await page.goto('/productos/');
  await expect(page.getByText('33 productos')).toBeVisible();
  await page.getByRole('navigation', { name: 'Filtrar por categoría' }).getByRole('link', { name: 'Bebidas' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Bebidas' })).toBeVisible();
  await expect(page.getByText('4 productos')).toBeVisible();
  await page.getByRole('link', { name: 'Solo con precio al mayor' }).click();
  await expect(page).toHaveURL(/categoria=bebidas&mayor=1/);
  await expect(page.getByText('2 productos')).toBeVisible();
});

test('una búsqueda sin resultados lo dice y ofrece salidas', async ({ page }) => {
  await page.goto('/productos/?q=iphone');
  await expect(page.getByRole('heading', { name: 'No encontramos «iphone»' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver todos los productos' })).toBeVisible();
});

test('una categoría inventada en la URL se ignora', async ({ page }) => {
  await page.goto('/productos/?categoria=../../etc');
  await expect(page.getByText('33 productos')).toBeVisible();
});

test('la ficha muestra precio, al mayor y vuelve al catálogo', async ({ page }) => {
  await page.goto('/productos/?categoria=viveres');
  await page.getByRole('link', { name: 'Harina de maíz precocida' }).click();
  await expect(page).toHaveURL('/productos/harina-maiz-1kg/');
  await expect(page.getByRole('heading', { level: 1, name: 'Harina de maíz precocida' })).toBeVisible();
  await expect(page.getByText('$ 1,15', { exact: true })).toBeVisible();
  await expect(page.getByText(/Desde 20 unidades pagas \$ 0,98 por unidad/)).toBeVisible();
  await expect(page).toHaveTitle('Harina de maíz precocida 1 kg | Don Pascal');
  await page.getByRole('navigation', { name: 'Ruta de navegación' }).getByRole('link', { name: 'Víveres' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Víveres' })).toBeVisible();
});

test('un producto que no existe responde 404 con buscador', async ({ page }) => {
  const respuesta = await page.goto('/productos/no-existe/');
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Este producto no está en el catálogo' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Buscar un producto' })).toBeVisible();
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('se busca y se filtra igual', async ({ page }) => {
    await page.goto('/productos/');
    await page.getByLabel('Categoría', { exact: true }).selectOption('reposteria');
    await page.getByRole('searchbox', { name: 'Buscar un producto' }).fill('azúcar');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Resultados para «azúcar»' })).toBeVisible();
    await expect(page.getByText('2 productos')).toBeVisible();
  });
});
