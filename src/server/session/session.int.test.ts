import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserId } from '@/core/ids';
import { resetConfigCache } from '@/shared/lib/config';
import { withApi } from '@/server/http/handler';
import { withSession } from '@/server/http/with-session';
import { getRequestContext } from '@/server/logging/context';
import { resetMockDb } from '@/server/mock/db';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { proxy } from '@/proxy';
import { newSessionId, signSessionId } from './cookie';
import { createSession, destroySession, getSessionFromRequest } from './session';

const ORIGIN = 'http://localhost:3000';
const SECRET = 's'.repeat(32);

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
const headerStore = vi.hoisted(() => ({ cookie: '', returnTo: '' }));

vi.mock('next/navigation', () => navigation);
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const match = headerStore.cookie.match(new RegExp(`${name}=([^;]+)`));
      return match ? { value: match[1] } : undefined;
    },
  }),
  headers: async () => new Headers({ 'x-return-to': headerStore.returnTo }),
}));

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', SECRET);
  vi.stubEnv('APP_ORIGIN', ORIGIN);
  vi.stubEnv('MOCK_LATENCY_MS', '0-0');
  resetConfigCache();
  resetMockDb();
  headerStore.cookie = '';
  headerStore.returnTo = '';
  navigation.redirect.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetConfigCache();
});

async function loggedIn() {
  const { session, setCookie } = await createSession(
    SEED_USER_IDS.ana as UserId,
    'America/Mexico_City',
  );
  const cookie = setCookie.split(';')[0] ?? '';
  return { session, cookie };
}

const page = (path: string, cookie?: string) =>
  new NextRequest(new URL(path, ORIGIN), cookie ? { headers: { cookie } } : {});

const location = (response: Response) => {
  const value = response.headers.get('location');
  return value ? new URL(value).pathname + new URL(value).search : null;
};

describe('[TC-INT-02][BR-14][UIR-AUTH-15][AC-AUTH-19][AC-AUTH-14] session gate and authority', () => {
  it('private page without a cookie → /login with returnTo (pasted URL in a fresh browser)', async () => {
    const response = await proxy(page('/transfer/amount?from=home'));
    expect(response.status).toBe(307);
    expect(location(response)).toBe('/login?returnTo=%2Ftransfer%2Famount%3Ffrom%3Dhome');
  });

  it('private page with an invalid cookie → /login with reason session_ended', async () => {
    const response = await proxy(page('/', 'session=forged.value'));
    expect(location(response)).toBe('/login?reason=session_ended');
  });

  it('valid cookie on /login → back to returnTo (or Home); with a reason it stays on login', async () => {
    const { cookie } = await loggedIn();
    expect(location(await proxy(page('/login', cookie)))).toBe('/');
    expect(location(await proxy(page('/login?returnTo=%2Ftransfer%2Frecipient', cookie)))).toBe(
      '/transfer/recipient',
    );
    expect(location(await proxy(page('/login?returnTo=https%3A%2F%2Fevil.example', cookie)))).toBe(
      '/',
    );
    const stay = await proxy(page('/login?reason=session_ended', cookie));
    expect(stay.headers.get('x-middleware-next')).toBe('1');
  });

  it('private API without a session → 401 at the proxy', async () => {
    const response = await proxy(page('/api/home/summary'));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('private API with a tampered cookie → 401', async () => {
    const { cookie } = await loggedIn();
    const at = cookie.indexOf('.') + 5;
    const tampered = `${cookie.slice(0, at)}${cookie[at] === 'A' ? 'B' : 'A'}${cookie.slice(at + 1)}`;
    expect((await proxy(page('/api/home/summary', tampered))).status).toBe(401);
  });

  describe('controller authority (proxy bypassed)', () => {
    const handler = vi.fn(async (_req: Request, context: { session: { userId: string } }) =>
      Response.json({ userId: context.session.userId, contextUser: getRequestContext()?.userId }),
    );
    const route = withApi('/api/test/private', withSession(handler));

    beforeEach(() => {
      handler.mockClear();
    });

    it('answers 401 without a cookie and never runs the handler', async () => {
      const response = await route(new Request(`${ORIGIN}/api/test/private`));
      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('answers 401 for a correctly signed cookie whose session does not exist', async () => {
      const unknown = await signSessionId(newSessionId(), SECRET);
      const response = await route(
        new Request(`${ORIGIN}/api/test/private`, { headers: { cookie: `session=${unknown}` } }),
      );
      expect(response.status).toBe(401);
    });

    it('answers 401 after logout destroys the session', async () => {
      const { session, cookie } = await loggedIn();
      expect(await destroySession(session)).toContain('Max-Age=0');
      const response = await route(
        new Request(`${ORIGIN}/api/test/private`, { headers: { cookie } }),
      );
      expect(response.status).toBe(401);
    });

    it('runs the handler with the session and tags the log context with the user', async () => {
      const { cookie } = await loggedIn();
      const response = await route(
        new Request(`${ORIGIN}/api/test/private`, { headers: { cookie } }),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        userId: SEED_USER_IDS.ana,
        contextUser: SEED_USER_IDS.ana,
      });
    });
  });

  describe('private layout authority', () => {
    it('redirects to login with returnTo and reason when the session record is gone', async () => {
      const { default: PrivateLayout } = await import('@/app/(private)/layout');
      headerStore.cookie = `session=${await signSessionId(newSessionId(), SECRET)}`;
      headerStore.returnTo = '/receipts/abc';
      await expect(PrivateLayout({ children: null })).rejects.toThrow(
        'NEXT_REDIRECT:/login?reason=session_ended&returnTo=%2Freceipts%2Fabc',
      );
    });

    it('renders children with a valid session', async () => {
      const { default: PrivateLayout } = await import('@/app/(private)/layout');
      headerStore.cookie = (await loggedIn()).cookie;
      const element = (await PrivateLayout({ children: 'home' })) as {
        props: { children: unknown[] };
      };
      expect(element.props.children).toContain('home');
    });
  });

  it('getSessionFromRequest returns the stored session for a valid cookie', async () => {
    const { session, cookie } = await loggedIn();
    const found = await getSessionFromRequest(new Request(ORIGIN, { headers: { cookie } }));
    expect(found).toEqual(session);
  });
});
