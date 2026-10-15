import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Dependency direction (ADR-010, TS-00 §3.3):
 *   app → features → shared → core        server → shared/lib, core
 *   inside shared: components → ui, hooks, api → lib → core
 *   inside core:   transfers → contacts, identity, money → common;  auth → identity → common
 * A feature never imports another feature, and imports always target a folder's index.ts.
 *
 * Flat config keeps only the last `no-restricted-imports` that matches a file, so every file
 * belongs to exactly one group below, which lists all of its patterns.
 */
const forbid = (regex, message) => ({ regex, message });
const group = (files, patterns, ignores = []) => ({
  files,
  ignores,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
});

const FOLDER_IMPORTS = [
  forbid(
    '^@/(core/[^/]+|shared/(ui|components|hooks)/[^/]+|features/[^/]+/(components|hooks)/[^/]+)/.+',
    'Import the folder (its index.ts), not a file inside it.',
  ),
];

const CORE_GROUPS = {
  common: [],
  money: ['common'],
  identity: ['common'],
  auth: ['common', 'identity'],
  contacts: ['common', 'identity'],
  transfers: ['common', 'identity', 'money', 'contacts'],
};
const FRAMEWORK_FREE = {
  group: ['react', 'react-dom', 'react/*', 'next', 'next/*', 'server-only', 'node:*', 'pino'],
  message: 'src/core is framework- and I/O-free.',
};
const coreGroups = Object.entries(CORE_GROUPS).map(([name, uses]) =>
  group(
    [`src/core/${name}/**/*.ts`],
    [
      forbid(
        '^@/(?!core/)',
        'src/core must not depend on outer layers (app, features, shared, server).',
      ),
      FRAMEWORK_FREE,
      forbid(
        `^@/core/(?!(${[name, ...uses].join('|')})(/|$))`,
        `src/core/${name} may use only: ${[...uses, 'itself'].join(', ')}.`,
      ),
      ...FOLDER_IMPORTS,
    ],
    ['**/*.test.ts'],
  ),
);

const FEATURES = ['auth', 'home', 'transfer', 'receipt'];
const featureGroups = FEATURES.map((feature) =>
  group(
    [`src/features/${feature}/**/*.{ts,tsx}`],
    [
      forbid(
        `^@/features/(?!${feature}(/|$))`,
        'A feature never imports another feature; move what both need to src/shared.',
      ),
      forbid('^@/app(/|$)', 'Features never import routes (src/app).'),
      ...FOLDER_IMPORTS,
    ],
  ),
);

const boundaries = [
  ...coreGroups,
  ...featureGroups,
  group(
    ['src/shared/lib/**/*.ts'],
    [
      forbid('^@/(features|app|server)(/|$)', 'src/shared/lib depends only on src/core.'),
      forbid(
        '^@/shared/(ui|components|hooks|api)(/|$)',
        'src/shared/lib depends only on src/core.',
      ),
      ...FOLDER_IMPORTS,
    ],
  ),
  group(
    ['src/shared/ui/**/*.{ts,tsx}'],
    [
      forbid('^@/(features|app|server)(/|$)', 'UI primitives know nothing about the product.'),
      forbid(
        '^@/shared/(components|hooks|api)(/|$)',
        'UI primitives use only shared/lib and core.',
      ),
      ...FOLDER_IMPORTS,
    ],
  ),
  group(
    ['src/shared/{components,hooks,api}/**/*.{ts,tsx}'],
    [
      forbid('^@/(features|app)(/|$)', 'src/shared is used by features; it never imports them.'),
      forbid('^@/server/(?!actions/)', 'Client-side shared code may only call Server Actions.'),
      ...FOLDER_IMPORTS,
    ],
  ),
  group(
    ['src/server/**/*.ts'],
    [
      forbid('^@/(features|app)(/|$)', 'The server never imports UI code.'),
      forbid(
        '^@/shared/(ui|components|hooks|api)(/|$)',
        'The server may use shared/lib and core only.',
      ),
      ...FOLDER_IMPORTS,
    ],
    ['**/*.test.ts'],
  ),
  // Routes, test helpers, and tests of core/server (integration tests call route handlers).
  group(
    [
      'src/app/**/*.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
      'src/styles/**/*.ts',
      'src/*.ts',
      'src/core/**/*.test.ts',
      'src/server/**/*.test.ts',
    ],
    FOLDER_IMPORTS,
  ),
];

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
