import { vi } from 'vitest';
import { resetConfigCache } from '@/lib/config';
import { resetMockDb } from '@/server/mock/db';

export const TEST_ORIGIN = 'http://localhost:3000';
export const TEST_SECRET = 's'.repeat(32);

/** Test configuration for route-handler tests: mock controls on, no simulated latency. */
export function setupApiEnv(overrides: Record<string, string> = {}): void {
  const env: Record<string, string> = {
    APP_ENV: 'test',
    SESSION_SECRET: TEST_SECRET,
    APP_ORIGIN: TEST_ORIGIN,
    MOCK_CONTROLS_ENABLED: 'true',
    MOCK_LATENCY_MS: '0-0',
    ...overrides,
  };
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  resetConfigCache();
  resetMockDb();
}

export function teardownApiEnv(): void {
  vi.unstubAllEnvs();
  resetConfigCache();
}

/** A same-origin JSON POST like the browser client sends (the proxy is not involved here). */
export function jsonPost(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request(`${TEST_ORIGIN}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': crypto.randomUUID(),
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

/** `session=<value>` from a Set-Cookie header, ready for a Cookie header. */
export function cookieFrom(response: Response): string {
  return response.headers.get('set-cookie')?.split(';')[0] ?? '';
}
