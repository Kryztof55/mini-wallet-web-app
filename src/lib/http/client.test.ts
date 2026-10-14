import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createHttpClient, type HttpClientDeps } from './client';

const schema = z.object({ balanceMinor: z.number() });

function setup(fetchImpl: HttpClientDeps['fetch']) {
  const onUnauthenticated = vi.fn();
  const fetch = vi.fn(fetchImpl);
  return { request: createHttpClient({ fetch, onUnauthenticated }), fetch, onUnauthenticated };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** A fetch that only settles when its signal aborts, like a hung server. */
const hangingFetch: HttpClientDeps['fetch'] = (_input, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () =>
      reject(new DOMException('Aborted', 'AbortError')),
    );
  });

describe('[TC-UNIT-23] browser HTTP client', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sends correlation, content-type and idempotency headers and parses a valid body', async () => {
    const { request, fetch } = setup(async () => json({ balanceMinor: 100 }));
    const result = await request('POST', '/api/transfers', {
      body: { amountMinor: 100 },
      schema,
      idempotencyKey: 'key-1',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.data).toEqual({ balanceMinor: 100 });

    const [path, init] = fetch.mock.calls[0] ?? [];
    const headers = init?.headers as Record<string, string>;
    expect(path).toBe('/api/transfers');
    expect(init?.body).toBe('{"amountMinor":100}');
    expect(init?.credentials).toBe('same-origin');
    expect(headers['content-type']).toBe('application/json');
    expect(headers['idempotency-key']).toBe('key-1');
    expect(headers['x-request-id']).toBe(result.value.requestId);
    expect(result.value.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('omits content-type and idempotency-key when not needed, and reuses a given request ID', async () => {
    const { request, fetch } = setup(async () => json({ balanceMinor: 1 }));
    await request('GET', '/api/home/summary', { schema, requestId: 'fixed-id' });
    const headers = fetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['content-type']).toBeUndefined();
    expect(headers['idempotency-key']).toBeUndefined();
    expect(headers['x-request-id']).toBe('fixed-id');
  });

  it('returns TIMEOUT exactly at the configured time and aborts the request', async () => {
    const { request, fetch } = setup(hangingFetch);
    let settled = false;
    const pending = request('POST', '/api/transfers', { schema, timeoutMs: 1000 }).then((r) => {
      settled = true;
      return r;
    });

    await vi.advanceTimersByTimeAsync(999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const result = await pending;

    expect(result).toMatchObject({ ok: false, error: { code: 'TIMEOUT', status: null } });
    expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it('maps a fetch rejection to NETWORK_ERROR and keeps the request ID for the reference code', async () => {
    const { request, fetch } = setup(async () => {
      throw new TypeError('Failed to fetch');
    });
    const result = await request('GET', '/api/x', { schema });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NETWORK_ERROR');
    const headers = fetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(result.error.requestId).toBe(headers['x-request-id']);
  });

  it('maps a caller abort to ABORTED, not TIMEOUT', async () => {
    const { request } = setup(hangingFetch);
    const controller = new AbortController();
    const pending = request('GET', '/api/x', { schema, signal: controller.signal });
    controller.abort();
    expect(await pending).toMatchObject({ ok: false, error: { code: 'ABORTED' } });
  });

  it('maps a catalog error body to its code, status and details', async () => {
    const { request } = setup(async () =>
      json(
        { code: 'INSUFFICIENT_FUNDS', message: 'x', requestId: 'r', details: { balance: 500 } },
        422,
      ),
    );
    expect(await request('POST', '/api/transfers', { schema, body: {} })).toEqual({
      ok: false,
      error: {
        code: 'INSUFFICIENT_FUNDS',
        status: 422,
        requestId: expect.any(String),
        details: { balance: 500 },
      },
    });
  });

  it('falls back to a code by status when the error body is not from the catalog', async () => {
    const { request } = setup(
      async () => new Response('<html>Bad gateway</html>', { status: 503 }),
    );
    expect(await request('GET', '/api/x', { schema })).toMatchObject({
      ok: false,
      error: { code: 'SERVICE_UNAVAILABLE', status: 503 },
    });
  });

  it('calls the unauthenticated handler on 401', async () => {
    const { request, onUnauthenticated } = setup(async () =>
      json({ code: 'UNAUTHENTICATED', message: 'x', requestId: 'r' }, 401),
    );
    const result = await request('GET', '/api/home/summary', { schema });
    expect(result).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
    expect(onUnauthenticated).toHaveBeenCalledOnce();
  });

  it('treats a 2xx that breaks the response contract as INTERNAL_ERROR', async () => {
    const { request } = setup(async () => json({ balanceMinor: 'lots' }));
    expect(await request('GET', '/api/x', { schema })).toMatchObject({
      ok: false,
      error: { code: 'INTERNAL_ERROR', status: 200 },
    });
  });

  it('resolves 204 responses without a schema to null data', async () => {
    const { request } = setup(async () => new Response(null, { status: 204 }));
    expect(await request('POST', '/api/auth/logout', { body: {} })).toMatchObject({
      ok: true,
      value: { data: null, status: 204 },
    });
  });
});
