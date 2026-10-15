import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLogger } from '@/server/logging/logger';
import { captureLogs } from '@/test/capture-logs';
import { jsonPost, setupApiEnv, teardownApiEnv } from '@/test/api';
import { POST } from './route';

const requestCode = (identifier: string, headers: Record<string, string> = {}) =>
  POST(jsonPost('/api/auth/code', { identifier }, headers));

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

describe('[TC-INT-03][FR-AUTH-01][FR-AUTH-02][FR-AUTH-12][BR-10][BR-13][AC-AUTH-16] POST /api/auth/code', () => {
  it('202 with the masked destination, timings and the demo code (mock controls on)', async () => {
    const response = await requestCode('+52 (55) 1234-5678');
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      destination: '•••• 5678',
      expiresInSec: 300,
      resendAvailableInSec: 30,
      demoCode: expect.stringMatching(/^\d{6}$/),
    });
  });

  it('masks emails', async () => {
    const body = await (await requestCode('  Ana@Demo.MX ')).json();
    expect(body.destination).toBe('a•••@demo.mx');
  });

  it('422 INVALID_IDENTIFIER for a value that is neither a phone nor an email', async () => {
    const response = await requestCode('12345');
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: 'INVALID_IDENTIFIER' });
  });

  it('400 VALIDATION_ERROR for a malformed body', async () => {
    const response = await POST(jsonPost('/api/auth/code', { identifier: 5512345678 }));
    expect(response.status).toBe(400);
  });

  it('429 CODE_THROTTLED with retryAfterSec within the cooldown, then allows a new code', async () => {
    await requestCode('5512345678');
    vi.setSystemTime(new Date('2026-10-14T18:00:10Z'));

    const throttled = await requestCode('5512345678');
    expect(throttled.status).toBe(429);
    expect(throttled.headers.get('retry-after')).toBe('20');
    expect(await throttled.json()).toMatchObject({
      code: 'CODE_THROTTLED',
      details: { retryAfterSec: 20 },
    });

    vi.setSystemTime(new Date('2026-10-14T18:00:30Z'));
    expect((await requestCode('5512345678')).status).toBe(202);
  });

  it('unknown identifier: same 202 and throttling (OQ-14); with mock controls, no code but a demo notice', async () => {
    const unknown = await (await requestCode('5599990000')).json();
    expect(unknown).toEqual({
      destination: '•••• 0000',
      expiresInSec: 300,
      resendAvailableInSec: 30,
      demoUnknownAccount: true,
    });
    expect((await requestCode('5599990000')).status).toBe(429);
  });

  it('503 SERVICE_UNAVAILABLE for the seeded failing user, without issuing a code', async () => {
    const response = await requestCode('falla.login@demo.mx');
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    // Nothing was issued, so there is no cooldown either.
    expect((await requestCode('falla.login@demo.mx')).status).toBe(503);
  });

  it('503 when forced with x-mock-outcome: service_unavailable', async () => {
    const response = await requestCode('5512345678', { 'x-mock-outcome': 'service_unavailable' });
    expect(response.status).toBe(503);
  });

  it('never logs the identifier or the code', async () => {
    const logs = captureLogs();
    const { demoCode } = await (await requestCode('ana@demo.mx')).json();
    await requestCode('5512345678');
    const all = JSON.stringify(logs);
    expect(logs.some((line) => line.event === 'auth.code.requested')).toBe(true);
    expect(all).not.toContain('ana@demo.mx');
    expect(all).not.toContain('5512345678');
    expect(all).not.toContain(demoCode);
  });
});
