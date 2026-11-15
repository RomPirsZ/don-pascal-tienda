// e2e 5 (plan §10): el chat con la API simulada, por teclado. /api/chat se sustituye con
// page.route y Turnstile con el sustituto local, en su URL real (así la CSP se comprueba igual).
import { test, expect, type Page, type Request } from '@playwright/test';
import { STUB_TOKEN, stubTurnstile } from './turnstile-stub';

const RESPUESTA = 'Sí: la harina de trigo leudante de 1 kg está en $ 1,30 (Bs 1.185,11). Precios de ejemplo.';

/** /api/chat simulada: responde lo que se le pida y guarda los cuerpos recibidos. */
async function simularApi(page: Page, respuesta: { status?: number; json: unknown } = { json: { texto: RESPUESTA } }) {
  const cuerpos: { mensajes: { rol: string; texto: string }[]; turnstile: string }[] = [];
  await page.route('/api/chat', async (ruta) => {
    cuerpos.push(ruta.request().postDataJSON());
    await ruta.fulfill({ status: respuesta.status ?? 200, json: respuesta.json });
  });
  return cuerpos;
}

const chat = (page: Page) => page.getByRole('dialog', { name: 'Don Pascal' });
const campo = (page: Page) => chat(page).getByRole('textbox', { name: 'Tu pregunta' });

/** Abre el chat con el teclado desde el botón flotante. */
async function abrirConTeclado(page: Page) {
  await page.getByRole('button', { name: 'Pregúntale a Don Pascal' }).focus();
  await page.keyboard.press('Enter');
  await expect(chat(page)).toBeVisible();
  await expect(campo(page)).toBeFocused();
}

test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
});

test('se pregunta y se lee la respuesta solo con el teclado', async ({ page }) => {
  const cuerpos = await simularApi(page);
  await page.goto('/');
  await abrirConTeclado(page);
  await expect(chat(page).getByText('Responde un asistente con IA (Claude, de Anthropic)')).toBeVisible();

  await page.keyboard.type('¿Tienen harina de trigo?');
  await page.keyboard.press('Enter');

  await expect(chat(page).getByText(RESPUESTA)).toBeVisible();
  await expect(page.locator('[data-chat-anuncio]')).toHaveText(`Don Pascal: ${RESPUESTA}`);
  await expect(campo(page)).toBeFocused();
  expect(cuerpos).toEqual([{ mensajes: [{ rol: 'cliente', texto: '¿Tienen harina de trigo?' }], turnstile: STUB_TOKEN }]);

  // Esc cierra y el foco vuelve al botón que lo abrió
  await page.keyboard.press('Escape');
  await expect(chat(page)).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pregúntale a Don Pascal' })).toBeFocused();
});

test('la segunda pregunta lleva el historial y un token nuevo', async ({ page }) => {
  const cuerpos = await simularApi(page);
  await page.goto('/');
  await abrirConTeclado(page);
  await page.keyboard.type('¿Tienen harina de trigo?');
  await page.keyboard.press('Enter');
  await expect(chat(page).getByText(RESPUESTA)).toBeVisible();
  await page.keyboard.type('¿Y azúcar?');
  await page.keyboard.press('Enter');
  await expect.poll(() => cuerpos.length).toBe(2);
  expect(cuerpos[1]?.mensajes).toEqual([
    { rol: 'cliente', texto: '¿Tienen harina de trigo?' },
    { rol: 'asistente', texto: RESPUESTA },
    { rol: 'cliente', texto: '¿Y azúcar?' },
  ]);
});

test('una pregunta de ejemplo se envía al pulsarla, y la conversación sigue al recargar', async ({ page }) => {
  await simularApi(page);
  await page.goto('/');
  await abrirConTeclado(page);
  await chat(page).getByRole('button', { name: '¿A qué hora abren el domingo?' }).click();
  await expect(chat(page).getByText(RESPUESTA)).toBeVisible();
  await expect(chat(page).getByRole('list', { name: 'Preguntas de ejemplo' })).toBeHidden();

  await page.reload();
  await abrirConTeclado(page);
  await expect(chat(page).getByRole('list', { name: 'Conversación con Don Pascal' }).getByText('¿A qué hora abren el domingo?')).toBeVisible();
  await expect(chat(page).getByText(RESPUESTA)).toBeVisible();

  await chat(page).getByRole('button', { name: 'Borrar la conversación' }).click();
  await expect(chat(page).getByText(RESPUESTA)).toBeHidden();
  await expect(chat(page).getByRole('list', { name: 'Preguntas de ejemplo' })).toBeVisible();
});

test('la respuesta segura y el tope remiten a WhatsApp', async ({ page }) => {
  await simularApi(page, { json: { texto: 'No tengo ese dato confirmado. Escríbenos por WhatsApp y te ayudamos.', remitir: true } });
  await page.goto('/');
  await abrirConTeclado(page);
  await page.keyboard.type('¿Me lo dejas en 50 centavos?');
  await page.keyboard.press('Enter');
  await expect(chat(page).getByText('No tengo ese dato confirmado.')).toBeVisible();

  await page.unroute('/api/chat');
  await simularApi(page, { status: 503, json: { error: 'tope' } });
  await page.keyboard.type('¿Y el azúcar?');
  await page.keyboard.press('Enter');
  await expect(chat(page).getByText('Don Pascal ya respondió muchas preguntas hoy.', { exact: false })).toBeVisible();
  await expect(page.locator('[data-chat-anuncio]')).toContainText('ya respondió muchas preguntas hoy');
});

test('si se pregunta muy rápido, la pregunta vuelve al campo para enviarla otra vez', async ({ page }) => {
  await simularApi(page, { status: 429, json: { error: 'limite' } });
  await page.goto('/');
  await abrirConTeclado(page);
  await page.keyboard.type('¿Tienen malta?');
  await page.keyboard.press('Enter');
  await expect(chat(page).getByText('Vas muy rápido.', { exact: false })).toBeVisible();
  await expect(campo(page)).toHaveValue('¿Tienen malta?');
  await expect(chat(page).getByRole('list', { name: 'Conversación con Don Pascal' }).getByText('¿Tienen malta?')).toHaveCount(0);
});

test('Turnstile solo se descarga al abrir el chat; el enlace del hero también lo abre', async ({ page }) => {
  const terceros: string[] = [];
  page.on('request', (r: Request) => r.url().includes('challenges.cloudflare.com') && terceros.push(r.url()));
  await simularApi(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(terceros).toEqual([]);

  await page.getByRole('link', { name: 'o pregúntale a Don Pascal' }).click();
  await expect(chat(page)).toBeVisible();
  await page.keyboard.type('Hola');
  await page.keyboard.press('Enter');
  await expect(chat(page).getByText(RESPUESTA)).toBeVisible();
  expect(terceros.length).toBeGreaterThan(0);
});

test.describe('sin JS', () => {
  test.use({ javaScriptEnabled: false });

  test('no hay chat: el enlace del hero lleva a la sección con WhatsApp', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Pregúntale a Don Pascal' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Escríbele aquí' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'o pregúntale a Don Pascal' })).toHaveAttribute('href', '#pregunta');
  });
});
