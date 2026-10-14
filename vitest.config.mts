import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Test levels (ADR-005, test plan §2):
 * - "node": unit (domain, lib), integration (route handlers, services, middleware)
 * - "dom":  presentation logic (hooks) and component tests, in jsdom
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/**/*.d.ts'],
      reporter: ['text', 'html'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'src/domain/**/*.test.ts',
            'src/lib/**/*.test.ts',
            'src/server/**/*.test.ts',
            'src/app/**/*.test.ts',
            'src/*.test.ts',
            'src/test/smoke/**/*.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: [
            'src/**/*.test.tsx',
            'src/features/**/*.test.ts',
            'src/components/**/*.test.ts',
          ],
        },
      },
    ],
  },
});
