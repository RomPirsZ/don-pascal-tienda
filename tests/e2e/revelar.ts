// Ayuda para los e2e del movimiento (E14): recorre la página como una persona para que las
// secciones que llegan al hacer scroll se revelen, y espera a que terminen las transiciones.
import type { Page } from '@playwright/test';

/** Baja media pantalla cada vez hasta el final, vuelve arriba y espera al estado en reposo. */
export async function recorrerYReposar(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const cuadro = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await cuadro();
    }
    window.scrollTo(0, 0);
  });
  // En reposo: solo pueden seguir los bucles (el vaivén de las insignias)
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
}
