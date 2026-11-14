import { defineConfig, devices } from '@playwright/test';

// Puerto propio: el 4321 es el de `astro dev` y el 4329 y el 4339 son los e2e del portafolio
// y del restaurante. Con reuseExistingServer, compartir puerto haría probar otro sitio.
const PORT = 4349;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  // Se prueba el build real en workerd, no el servidor de desarrollo. En CI el build es un paso previo.
  webServer: {
    command: `${process.env['CI'] ? '' : 'npm run build && '}npx astro preview --ignore-lock --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
