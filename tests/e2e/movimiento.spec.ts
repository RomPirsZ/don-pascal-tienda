// e2e 6: movimiento (E14, spec §8). Con reduced-motion no hay animaciones (constitución II);
// sin él, las secciones llegan al hacer scroll sin que nada visible desaparezca.
import { test, expect, type Page } from '@playwright/test';
import { recorrerYReposar } from './revelar';

/** Lo que está marcado como pendiente de revelar y ya se ve en pantalla (tendría que ser nada). */
const ocultosEnPantalla = (page: Page) =>
  page.$$eval('.revelar-pendiente', (els) => els.filter((e) => e.getBoundingClientRect().top < window.innerHeight).length);

test.describe('con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no hay animaciones ni nada escondido, y el carrito se abre sin deslizarse', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Carrito/ })).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await expect(page.locator('.revelar-pendiente')).toHaveCount(0);

    await page.getByRole('button', { name: /^Carrito/ }).click();
    const carrito = page.locator('#carrito');
    await expect(carrito).toBeVisible();
    expect(await carrito.evaluate((d) => [getComputedStyle(d).transitionDuration, getComputedStyle(d).translate])).toEqual(['0s', 'none']);

    // Añadir un producto no hace latir el contador
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Añadir/ }).first().click();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe('con movimiento', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('Don Pascal llega al cargar y las secciones de abajo se revelan al bajar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Carrito/ })).toBeVisible();
    // El nombre de la animación, no la animación en curso: en una máquina lenta ya habría terminado
    await expect(page.locator('.hero-don-pascal')).toHaveCSS('animation-name', /don-pascal-sube/);
    // El texto del hero llega en cascada: titular, apoyo, buscador, enlace y aviso
    // El titular y el apoyo se enfocan sin partir de invisibles (el LCP no espera, E16); el buscador aparece
    await expect(page.locator('#hero-titulo > span').first()).toHaveCSS('animation-name', 'texto-enfoca');
    await expect(page.locator('.hero-entrada > :nth-child(3)')).toHaveCSS('animation-name', 'texto-llega');
    await expect(page.locator('.hero-entrada > form, .hero-entrada > div').first()).toHaveCSS('animation-delay', '0.24s');

    // Nada de lo que se ve al cargar queda escondido; lo de abajo espera su turno
    expect(await ocultosEnPantalla(page)).toBe(0);
    const titulo = page.getByRole('heading', { name: 'Cómo pedir' });
    await expect(titulo).toHaveClass(/revelar-pendiente/);

    await titulo.scrollIntoViewIfNeeded();
    await expect(titulo).not.toHaveClass(/revelar-pendiente/);
    await expect(titulo).toHaveCSS('opacity', '1');
  });

  test('al bajar hasta el final no queda ninguna sección sin revelar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Carrito/ })).toBeVisible();
    // Como una persona, media pantalla cada vez. (Un salto con un enlace deja lo saltado
    // pendiente hasta que se ve, y eso es lo esperado.)
    await recorrerYReposar(page);
    await expect(page.locator('.revelar-pendiente')).toHaveCount(0);
    expect(await page.$$eval('[data-revelar]', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length)).toBe(0);
  });

  test('con el teclado, el foco nunca cae en algo todavía escondido', async ({ page, isMobile }) => {
    test.skip(isMobile, 'el recorrido con Tab es de escritorio');
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Carrito/ })).toBeVisible();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('.revelar-pendiente'))).toBe(false);
    }
  });

  test('el vaivén de las insignias se pausa cuando el hero no se ve', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('[data-hero]');
    await expect(hero).not.toHaveAttribute('data-fuera');
    await page.locator('#como-pedir').scrollIntoViewIfNeeded();
    await expect(hero).toHaveAttribute('data-fuera');
  });

  test('el carrito se desliza al abrirse y se cierra con Esc', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Carrito/ }).click();
    const carrito = page.locator('#carrito');
    await expect(carrito).toBeVisible();
    await expect(carrito).toHaveCSS('transition-property', /translate/);
    await expect(carrito).toHaveCSS('translate', 'none');
    await page.keyboard.press('Escape');
    await expect(carrito).toBeHidden();
  });
});
