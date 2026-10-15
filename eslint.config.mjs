import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Dependency direction (ADR-010, TS-00 §3.3):
 *   app → features → shared → core        server → shared/lib, core
 * Inside shared: components → ui, hooks, api → lib → core.
 * A feature never imports another feature: what two features need lives in `shared`.
 */
const FEATURES = ['auth', 'home', 'transfer', 'receipt'];

const restrict = (files, patterns, ignores = []) => ({
  files,
  ignores,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
});
const forbid = (regex, message) => ({ regex, message });

const boundaries = [
  restrict(
    ['src/**/*.{ts,tsx}'],
    [
      forbid(
        '^@/(shared/(ui|components|hooks)|features/[^/]+/(components|hooks))/[^/]+/.+',
        'Import the component or hook folder (its index.ts), not a file inside it.',
      ),
    ],
  ),
  ...FEATURES.map((feature) =>
    restrict(
      [`src/features/${feature}/**/*.{ts,tsx}`],
      [
        forbid(
          `^@/features/(?!${feature}(/|$))`,
          'A feature never imports another feature; move what both need to src/shared.',
        ),
        forbid('^@/app(/|$)', 'Features never import routes (src/app).'),
      ],
    ),
  ),
  restrict(
    ['src/shared/**/*.{ts,tsx}'],
    [
      forbid('^@/(features|app)(/|$)', 'src/shared is used by features; it never imports them.'),
      forbid(
        '^@/server/(?!actions/)',
        'Client-side shared code may only call Server Actions from src/server.',
      ),
    ],
  ),
  restrict(
    ['src/shared/lib/**/*.ts'],
    [
      forbid('^@/(features|app|server)(/|$)', 'src/shared/lib depends only on src/core.'),
      forbid(
        '^@/shared/(ui|components|hooks|api)(/|$)',
        'src/shared/lib depends only on src/core.',
      ),
    ],
  ),
  restrict(
    ['src/shared/ui/**/*.{ts,tsx}'],
    [
      forbid('^@/(features|app|server)(/|$)', 'UI primitives know nothing about the product.'),
      forbid(
        '^@/shared/(components|hooks|api)(/|$)',
        'UI primitives use only shared/lib and core.',
      ),
    ],
  ),
  restrict(
    ['src/server/**/*.ts'],
    [
      forbid('^@/(features|app)(/|$)', 'The server never imports UI code.'),
      forbid(
        '^@/shared/(ui|components|hooks|api)(/|$)',
        'The server may use shared/lib and core only.',
      ),
    ],
    // Integration tests call route handlers on purpose.
    ['src/server/**/*.test.ts'],
  ),
];

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
              message: 'src/core must not depend on outer layers (app, features, shared, server).',
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
  ...boundaries,
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
