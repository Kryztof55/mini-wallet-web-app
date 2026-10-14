import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * E2E (ADR-005, test plan §3):
 * - Runs against a production build, with mock controls enabled through APP_ENV=test.
 * - Timings are shortened so timeout scenarios run in seconds.
 * - One worker: the in-memory mock state is shared by the server, and each test resets it.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-light', use: { ...devices['Desktop Chrome'], colorScheme: 'light' } },
    { name: 'chromium-dark', use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
    { name: 'webkit-mobile-light', use: { ...devices['iPhone 13'], colorScheme: 'light' } },
    { name: 'webkit-mobile-dark', use: { ...devices['iPhone 13'], colorScheme: 'dark' } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      APP_ENV: 'test',
      APP_ORIGIN: BASE_URL,
      SESSION_SECRET: 'e2e-only-secret-not-for-production-use-0123456789',
      MOCK_CONTROLS_ENABLED: 'true',
      OTP_RESEND_COOLDOWN_SEC: '2',
      NEXT_PUBLIC_TRANSFER_SLOW_MS: '300',
      NEXT_PUBLIC_TRANSFER_TIMEOUT_MS: '1000',
      NEXT_PUBLIC_TRANSFER_STATUS_CHECK_DELAYS_MS: '200,400,800',
      MOCK_LATENCY_MS: '0-50',
    },
  },
});
