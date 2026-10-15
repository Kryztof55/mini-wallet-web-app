import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Test levels (ADR-005, test plan §2):
 * - "node": unit (core, shared/lib), integration (route handlers, services, proxy)
 * - "dom":  presentation logic (hooks) and component tests, in jsdom
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./src/test/empty-module.ts', import.meta.url)),
    },
  },
  test: {
    restoreMocks: true,
    // Server logs are asserted through injected loggers; keep the console quiet.
    env: { LOG_LEVEL: 'silent' },
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
            'src/core/**/*.test.ts',
            'src/shared/lib/**/*.test.ts',
            'src/shared/api/**/*.test.ts',
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
            'src/shared/ui/**/*.test.ts',
            'src/shared/components/**/*.test.ts',
            'src/shared/hooks/**/*.test.ts',
          ],
        },
      },
    ],
  },
});
