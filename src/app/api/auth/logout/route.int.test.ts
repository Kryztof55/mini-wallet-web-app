import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { withApi } from '@/server/http/handler';
import { withSession } from '@/server/http/with-session';
import { getMockDb } from '@/server/mock/db';
import { cookieFrom, jsonPost, setupApiEnv, teardownApiEnv, TEST_ORIGIN } from '@/test/api';
import { POST as requestCode } from '../code/route';
import { POST as verify } from '../verify/route';
import { POST } from './route';

const privateRoute = withApi(
  '/api/test/private',
  withSession(async () => Response.json({ ok: true })),
);

async function login(): Promise<string> {
  const issued = await requestCode(jsonPost('/api/auth/code', { identifier: '5512345678' }));
  const { demoCode } = (await issued.json()) as { demoCode: string };
  const verified = await verify(
    jsonPost('/api/auth/verify', { identifier: '5512345678', code: demoCode }),
  );
  return cookieFrom(verified);
}

beforeEach(() => setupApiEnv());
afterEach(() => teardownApiEnv());

describe('[TC-INT-05][FR-AUTH-10] POST /api/auth/logout', () => {
  it('204, deletes the session, clears the cookie, and the old cookie no longer works', async () => {
    const cookie = await login();
    const callPrivate = () =>
      privateRoute(new Request(`${TEST_ORIGIN}/api/test/private`, { headers: { cookie } }));
    expect((await callPrivate()).status).toBe(200);

    const response = await POST(jsonPost('/api/auth/logout', {}, { cookie }));
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toBe(
      'session=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0',
    );
    expect(getMockDb().sessions.size).toBe(0);

    expect((await callPrivate()).status).toBe(401);
  });

  it('is idempotent without a session', async () => {
    const response = await POST(jsonPost('/api/auth/logout', {}));
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
