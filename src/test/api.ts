import type { UserId } from '@/core/ids';
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

/** A real session for a seeded user, as a Cookie header value (route-handler tests). */
export async function sessionCookieFor(userId: string): Promise<string> {
  const { createSession } = await import('@/server/session/session');
  const { setCookie } = await createSession(userId as UserId, 'America/Mexico_City');
  return setCookie.split(';')[0] ?? '';
}

/** A same-origin GET like the browser client sends. */
export function jsonGet(path: string, headers: Record<string, string> = {}): Request {
  return new Request(`${TEST_ORIGIN}${path}`, {
    headers: { 'x-request-id': crypto.randomUUID(), ...headers },
  });
}
