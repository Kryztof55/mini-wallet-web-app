import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Coding standards from TS-00 §14:
 * - no `any`, no non-null assertions, no unused code
 * - exhaustive handling of unions is enforced by the compiler (`never` checks)
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{ts,tsx,mts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Dependency direction (TS-00 §3): `src/core` is pure TypeScript and imports nothing
    // from the project's outer layers, the framework or I/O. Everyone may import `core`.
    files: ['src/core/**/*.ts'],
    ignores: ['src/core/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/*', '!@/core', '!@/core/**'],
              message:
                'src/core must not depend on outer layers (app, features, components, server, lib).',
            },
            {
              group: [
                'react',
                'react-dom',
                'react/*',
                'next',
                'next/*',
                'server-only',
                'node:*',
                'pino',
              ],
              message: 'src/core is framework- and I/O-free.',
            },
          ],
        },
      ],
    },
  },
  {
    // Playwright fixtures receive a `use` callback that is not React's `use()` hook.
    files: ['tests/e2e/**/*.ts'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
]);
