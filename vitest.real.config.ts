import { defineConfig } from 'vitest/config';

// Batería de E12 contra la API real de Claude: cuesta dinero. Solo con
// `npm run test:asistente-real`; `npm test` usa vitest.config.ts y no la incluye.
// Una pregunta tras otra (hasta 4 vueltas de 30 s cada una más un reintento).
export default defineConfig({
  test: {
    include: ['tests/asistente-real/**/*.real.test.ts'],
    fileParallelism: false,
    testTimeout: 300_000,
  },
});
