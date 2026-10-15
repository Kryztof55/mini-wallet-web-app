import { describe, expect, it } from 'vitest';
import { POST } from './route';

const event = (overrides: Record<string, unknown> = {}) => ({
  event: 'tx.confirm.timeout',
  level: 'warn',
  requestId: '3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b',
  route: '/transfer/summary',
  at: '2026-10-14T18:00:00.000Z',
  ...overrides,
});

function post(body: unknown, ip: string) {
  return POST(
    new Request('http://localhost/api/client-logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
  );
}

describe('[TC-INT-13][NFR-04] client logs endpoint', () => {
  it('accepts catalog events and answers with a correlation ID', async () => {
    const response = await post({ events: [event()] }, '10.0.0.1');
    expect(response.status).toBe(204);
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects more than 10 events', async () => {
    const response = await post({ events: Array.from({ length: 11 }, () => event()) }, '10.0.0.2');
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      requestId: expect.any(String),
    });
  });

  it('rejects events larger than 2 KB', async () => {
    const response = await post(
      { events: [event({ details: { note: 'x'.repeat(2100) } })] },
      '10.0.0.3',
    );
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  });

  it.each([
    ['unknown event', event({ event: 'auth.verify.succeeded' })],
    ['extra field', event({ password: 'x' })],
    ['bad level', event({ level: 'info' })],
  ])('rejects %s', async (_label, bad) => {
    expect((await post({ events: [bad] }, '10.0.0.4')).status).toBe(400);
  });

  it('rate-limits a client after 20 requests per minute', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 21; i += 1)
      statuses.push((await post({ events: [event()] }, '10.0.0.5')).status);
    expect(statuses.slice(0, 20).every((s) => s === 204)).toBe(true);
    expect(statuses[20]).toBe(429);
  });

  it('answers 429 with Retry-After once limited', async () => {
    let last: Response | undefined;
    for (let i = 0; i < 21; i += 1) last = await post({ events: [event()] }, '10.0.0.6');
    expect(last?.status).toBe(429);
    expect(Number(last?.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await last?.json()).toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('rejects non-JSON bodies with 415', async () => {
    const response = await POST(
      new Request('http://localhost/api/client-logs', {
        method: 'POST',
        headers: { 'content-type': 'text/plain', 'x-forwarded-for': '10.0.0.7' },
        body: 'hello',
      }),
    );
    expect(response.status).toBe(415);
  });
});
