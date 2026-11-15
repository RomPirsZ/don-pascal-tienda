// Accesibilidad (constitución III): axe sin violaciones serias ni críticas, también con el
// carrito y el chat abiertos.
import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { recorrerYReposar } from './revelar';
import { stubTurnstile } from './turnstile-stub';

async function sinViolacionesSerias(page: Page, que: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), que).toEqual([]);
}

for (const ruta of ['/', '/productos/', '/productos/?q=iphone', '/productos/fondant-blanco-1kg/', '/productos/no-existe/', '/no-existe/']) {
  test(`axe: ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    // axe mide la página en reposo: con las secciones ya reveladas y sin transiciones a medias (E14)
    await recorrerYReposar(page);
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

test('axe: chat abierto con una conversación y un aviso de error', async ({ page }) => {
  await stubTurnstile(page);
  await page.route('/api/chat', (ruta) => ruta.fulfill({ status: 503, json: { error: 'tope' } }));
  await page.goto('/');
  await page.evaluate(() =>
    sessionStorage.setItem('don-pascal:chat', JSON.stringify([{ rol: 'cliente', texto: '¿Tienen harina?' }, { rol: 'asistente', texto: 'Sí, de trigo y de maíz.' }])),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Pregúntale a Don Pascal' }).click();
  const chat = page.getByRole('dialog', { name: 'Don Pascal' });
  await chat.getByRole('textbox', { name: 'Tu pregunta' }).fill('¿Y azúcar?');
  await chat.getByRole('button', { name: 'Enviar' }).click();
  await expect(chat.getByText('ya respondió muchas preguntas hoy')).toBeVisible();
  await sinViolacionesSerias(page, 'chat');
});
