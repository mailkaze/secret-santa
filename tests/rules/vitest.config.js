import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Pruebas de reglas: se ejecutan contra el emulador de Firestore con `npm run test:rules`.
export default defineConfig({
  root: fileURLToPath(new URL('../..', import.meta.url)),
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.js'],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});
