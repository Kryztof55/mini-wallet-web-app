import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockDb } from '@/server/mock/db';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { setLogger } from '@/server/logging/logger';
import { captureLogs } from '@/test/capture-logs';
import { jsonPost, setupApiEnv, teardownApiEnv } from '@/test/api';
import { POST as requestCodeRoute } from '../code/route';
import { POST } from './route';

const IDENTIFIER = '5512345678';

async function issueCode(identifier = IDENTIFIER): Promise<string> {
  const response = await requestCodeRoute(jsonPost('/api/auth/code', { identifier }));
  return ((await response.json()) as { demoCode: string }).demoCode;
}

const verify = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  POST(jsonPost('/api/auth/verify', { identifier: IDENTIFIER, ...body }, headers));

const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, '0');

beforeEach(() => {
  setupApiEnv({ OTP_RESEND_COOLDOWN_SEC: '30' });
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-14T18:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  setLogger(undefined);
  teardownApiEnv();
});

describe('[TC-INT-04][FR-AUTH-06][FR-AUTH-13][FR-AUTH-14][BR-11][BR-12][AC-AUTH-09] POST /api/auth/verify', () => {
  it('200 with first name and redirect, sets the session cookie and stores the time zone', async () => {
    const code = await issueCode();
    const response = await verify({ code, timeZone: 'America/Tijuana' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ firstName: 'Ana', redirectTo: '/' });
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^session=[\w-]{43}\.[\w-]{43}; Path=\/; SameSite=Lax; HttpOnly$/);

    const sessions = [...getMockDb().sessions.values()];
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ userId: SEED_USER_IDS.ana, timeZone: 'America/Tijuana' });
  });

  it('accepts the code with spaces or dashes and falls back to the default time zone', async () => {
    const code = await issueCode();
    const response = await verify({
      code: `${code.slice(0, 3)} ${code.slice(3)}`,
      timeZone: 'Mars/Base',
    });
    expect(response.status).toBe(200);
    expect([...getMockDb().sessions.values()][0]?.timeZone).toBe('America/Mexico_City');
  });

  it('marks the cookie Secure on an https origin', async () => {
    setupApiEnv({ APP_ORIGIN: 'https://wallet.example.mx' });
    const code = await issueCode();
    expect((await verify({ code })).headers.get('set-cookie')).toContain('; Secure');
  });

  it.each([
    ['/transfer/amount?from=home', '/transfer/amount?from=home'],
    ['https://evil.example/steal', '/'],
    ['//evil.example', '/'],
    ['/login', '/'],
  ])('sanitizes returnTo %s → %s', async (returnTo, expected) => {
    const code = await issueCode();
    expect(await (await verify({ code, returnTo })).json()).toMatchObject({ redirectTo: expected });
  });

  it('INVALID_CODE_FORMAT consumes no attempt; CODE_INCORRECT counts down; the third locks', async () => {
    const code = await issueCode();

    for (const bad of ['12345', 'abcdef', '1234567']) {
      const response = await verify({ code: bad });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ code: 'INVALID_CODE_FORMAT' });
    }

    expect(await (await verify({ code: wrong(code) })).json()).toMatchObject({
      code: 'CODE_INCORRECT',
      details: { attemptsLeft: 2 },
    });
    expect(await (await verify({ code: wrong(code) })).json()).toMatchObject({
      code: 'CODE_INCORRECT',
      details: { attemptsLeft: 1 },
    });
    expect(await (await verify({ code: wrong(code) })).json()).toMatchObject({
      code: 'CODE_LOCKED',
    });
    // Locked means locked, even with the right code.
    expect(await (await verify({ code })).json()).toMatchObject({ code: 'CODE_LOCKED' });
    // A locked challenge allows a new code right away (BR-13).
    const fresh = await issueCode();
    expect((await verify({ code: fresh })).status).toBe(200);
  });

  it('CODE_EXPIRED after the TTL, and when forced with otp_expired (stays expired)', async () => {
    const code = await issueCode();
    vi.setSystemTime(new Date('2026-10-14T18:05:01Z'));
    expect(await (await verify({ code })).json()).toMatchObject({ code: 'CODE_EXPIRED' });

    const second = await issueCode();
    const forced = await verify({ code: second }, { 'x-mock-outcome': 'otp_expired' });
    expect(await forced.json()).toMatchObject({ code: 'CODE_EXPIRED' });
    expect(await (await verify({ code: second })).json()).toMatchObject({ code: 'CODE_EXPIRED' });
  });

  it('an older code stops working once a new one is issued', async () => {
    const first = await issueCode();
    vi.setSystemTime(new Date('2026-10-14T18:00:31Z'));
    const second = await issueCode();
    expect(first).not.toBe(second);
    expect(await (await verify({ code: first })).json()).toMatchObject({ code: 'CODE_INCORRECT' });
    expect((await verify({ code: second })).status).toBe(200);
  });

  it('a code cannot be used twice', async () => {
    const code = await issueCode();
    expect((await verify({ code })).status).toBe(200);
    expect(await (await verify({ code })).json()).toMatchObject({ code: 'CODE_EXPIRED' });
  });

  it('503 when forced, without consuming an attempt', async () => {
    const code = await issueCode();
    const failed = await verify({ code: wrong(code) }, { 'x-mock-outcome': 'service_unavailable' });
    expect(failed.status).toBe(503);
    expect(await (await verify({ code: wrong(code) })).json()).toMatchObject({
      details: { attemptsLeft: 2 },
    });
  });

  it('unknown identifiers fail like a wrong code and never verify (OQ-14)', async () => {
    const demo = await issueCode('5599990000');
    const response = await POST(
      jsonPost('/api/auth/verify', { identifier: '5599990000', code: demo }),
    );
    expect(await response.json()).toMatchObject({
      code: 'CODE_INCORRECT',
      details: { attemptsLeft: 2 },
    });
  });

  it('never logs the code, the identifier or the session cookie', async () => {
    const logs = captureLogs();
    const code = await issueCode();
    await verify({ code: wrong(code) });
    const ok = await verify({ code });
    const all = JSON.stringify(logs);
    expect(logs.some((line) => line.event === 'auth.verify.succeeded')).toBe(true);
    expect(all).not.toContain(code);
    expect(all).not.toContain(IDENTIFIER);
    expect(all).not.toContain((ok.headers.get('set-cookie') ?? 'x').split(';')[0]?.split('=')[1]);
  });
});
