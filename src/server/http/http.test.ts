import { Writable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { domainError, ERROR_CODES } from '@/core/common';
import { createLogger, setLogger } from '@/server/logging/logger';
import { withApi } from './handler';
import { parseJsonBody } from './parse-body';
import { errorResponse, jsonOk, noContent } from './respond';
import { HTTP_STATUS_BY_CODE } from './status';

const REQUEST_ID = '0b9f3a12-c4d5-4e6f-8a7b-1c2d3e4f5a6b';

const EXPECTED_STATUS = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  CSRF_REJECTED: 403,
  NOT_FOUND: 404,
  IDEMPOTENCY_KEY_REUSED: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INVALID_IDENTIFIER: 422,
  INVALID_CODE_FORMAT: 422,
  CODE_INCORRECT: 422,
  CODE_EXPIRED: 422,
  CODE_LOCKED: 422,
  INVALID_AMOUNT: 422,
  INSUFFICIENT_FUNDS: 422,
  RECIPIENT_REQUIRED: 422,
  SELF_TRANSFER: 422,
  INVALID_CONCEPT: 422,
  INVALID_CONTACT_NAME: 422,
  CODE_THROTTLED: 429,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  NETWORK_UNAVAILABLE: 503,
  SERVICE_UNAVAILABLE: 503,
} as const;

function captureLogs() {
  const lines: Record<string, unknown>[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _enc, done) {
      lines.push(JSON.parse(chunk.toString()) as Record<string, unknown>);
      done();
    },
  });
  setLogger(createLogger({ level: 'debug', destination }));
  return lines;
}

afterEach(() => setLogger(undefined));

describe('[TC-UNIT-16] error code → HTTP mapping', () => {
  it.each(ERROR_CODES.map((code) => [code, EXPECTED_STATUS[code]] as const))(
    '%s → %i with the common error body',
    async (code, status) => {
      expect(HTTP_STATUS_BY_CODE[code]).toBe(status);
      const response = errorResponse(domainError(code), REQUEST_ID);
      expect(response.status).toBe(status);
      expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
      expect(response.headers.get('cache-control')).toBe('no-store');
      const body = (await response.json()) as Record<string, unknown>;
      expect(body).toEqual({ code, message: expect.any(String), requestId: REQUEST_ID });
    },
  );

  it('covers the whole catalog', () => {
    expect(Object.keys(HTTP_STATUS_BY_CODE).sort()).toEqual([...ERROR_CODES].sort());
  });

  it('includes details and a Retry-After header when the error carries retryAfterSec', async () => {
    const response = errorResponse(
      domainError('CODE_THROTTLED', { retryAfterSec: 30 }),
      REQUEST_ID,
    );
    expect(response.headers.get('retry-after')).toBe('30');
    expect(await response.json()).toMatchObject({ details: { retryAfterSec: 30 } });
  });

  it('never leaks internals in the message', async () => {
    const body = (await errorResponse(domainError('INTERNAL_ERROR'), REQUEST_ID).json()) as {
      message: string;
    };
    expect(body.message).toBe('Something went wrong.');
  });

  it('builds success responses with no-store and the request ID', async () => {
    const ok = jsonOk({ a: 1 }, REQUEST_ID, 201);
    expect(ok.status).toBe(201);
    expect(ok.headers.get('cache-control')).toBe('no-store');
    expect(await ok.json()).toEqual({ a: 1 });
    expect(noContent(REQUEST_ID).status).toBe(204);
  });
});

describe('parseJsonBody (ADR-009)', () => {
  const schema = z.strictObject({ amount: z.number().int() });
  const post = (body: string, contentType = 'application/json') =>
    new Request('http://localhost/api/x', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body,
    });

  it('returns the typed body when it matches the schema', async () => {
    expect(await parseJsonBody(post('{"amount":100}'), schema)).toEqual({
      ok: true,
      value: { amount: 100 },
    });
  });

  it('rejects non-JSON media types with UNSUPPORTED_MEDIA_TYPE', async () => {
    const result = await parseJsonBody(
      post('amount=1', 'application/x-www-form-urlencoded'),
      schema,
    );
    expect(result).toEqual({ ok: false, error: { code: 'UNSUPPORTED_MEDIA_TYPE' } });
  });

  it('rejects malformed JSON and schema mismatches with VALIDATION_ERROR', async () => {
    expect(await parseJsonBody(post('{nope'), schema)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION_ERROR', details: { reason: 'invalid_json' } },
    });
    expect(await parseJsonBody(post('{"amount":"1"}'), schema)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION_ERROR', details: { reason: 'schema', field: 'amount' } },
    });
    expect(await parseJsonBody(post('{"amount":1,"extra":true}'), schema)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});

describe('withApi', () => {
  it('reuses a valid incoming request ID, sets it on the response and logs one summary line', async () => {
    const logs = captureLogs();
    const handler = withApi('/api/test', async (_req, { requestId }) =>
      errorResponse(domainError('INSUFFICIENT_FUNDS'), requestId),
    );
    const response = await handler(
      new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-request-id': REQUEST_ID },
      }),
    );
    expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      event: 'http.request.completed',
      level: 'info',
      requestId: REQUEST_ID,
      route: '/api/test',
      method: 'POST',
      status: 422,
      errorCode: 'INSUFFICIENT_FUNDS',
    });
  });

  it('generates an ID when the incoming one is invalid', async () => {
    captureLogs();
    const handler = withApi('/api/test', async () => new Response(null, { status: 204 }));
    const response = await handler(
      new Request('http://localhost/api/test', { headers: { 'x-request-id': 'not-a-uuid' } }),
    );
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('x-request-id')).not.toBe('not-a-uuid');
  });

  it('turns an unexpected exception into a generic 500 and logs it at error level', async () => {
    const logs = captureLogs();
    const handler = withApi('/api/test', async () => {
      throw new Error('database exploded at 10.0.0.3');
    });
    const response = await handler(new Request('http://localhost/api/test'));
    expect(response.status).toBe(500);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toContain('10.0.0.3');
    expect(logs[0]).toMatchObject({ level: 'error', status: 500, errorCode: 'INTERNAL_ERROR' });
    expect(logs[0]?.err).toBeDefined();
  });
});
