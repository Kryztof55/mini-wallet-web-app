import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetConfigCache } from '@/lib/config';
import { proxy } from './proxy';

const ORIGIN = 'http://localhost:3000';
const REQUEST_ID = '0b9f3a12-c4d5-4e6f-8a7b-1c2d3e4f5a6b';

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', 's'.repeat(32));
  vi.stubEnv('APP_ORIGIN', ORIGIN);
  resetConfigCache();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetConfigCache();
});

function apiRequest(
  path: string,
  { method = 'POST', headers = {} }: { method?: string; headers?: Record<string, string> } = {},
) {
  return new NextRequest(new URL(path, ORIGIN), {
    method,
    headers,
    ...(method === 'GET' ? {} : { body: '{}' }),
  });
}

const sameOrigin = {
  origin: ORIGIN,
  'content-type': 'application/json',
  'x-request-id': REQUEST_ID,
};

const passedThrough = (response: Response) => response.headers.get('x-middleware-next') === '1';

describe('[TC-INT-01][NFR-17][ADR-004] CSRF protection matrix', () => {
  it('lets a same-origin JSON request with x-request-id through', async () => {
    const response = await proxy(apiRequest('/api/auth/code', { headers: sameOrigin }));
    expect(passedThrough(response)).toBe(true);
    expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
  });

  it('accepts a missing Origin only with Sec-Fetch-Site: same-origin', async () => {
    const { origin: _origin, ...noOrigin } = sameOrigin;
    const ok = await proxy(
      apiRequest('/api/auth/code', { headers: { ...noOrigin, 'sec-fetch-site': 'same-origin' } }),
    );
    expect(passedThrough(ok)).toBe(true);

    const crossSite = await proxy(
      apiRequest('/api/auth/code', { headers: { ...noOrigin, 'sec-fetch-site': 'cross-site' } }),
    );
    expect(crossSite.status).toBe(403);

    const noMetadata = await proxy(apiRequest('/api/auth/code', { headers: noOrigin }));
    expect(noMetadata.status).toBe(403);
  });

  it('rejects a foreign Origin with 403 CSRF_REJECTED and a correlation ID', async () => {
    const response = await proxy(
      apiRequest('/api/auth/verify', {
        headers: { ...sameOrigin, origin: 'https://evil.example' },
      }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: 'CSRF_REJECTED',
      message: expect.any(String),
      requestId: REQUEST_ID,
    });
  });

  it('rejects a missing or malformed x-request-id with 403', async () => {
    const { 'x-request-id': _id, ...noId } = sameOrigin;
    expect((await proxy(apiRequest('/api/auth/code', { headers: noId }))).status).toBe(403);
    expect(
      (
        await proxy(
          apiRequest('/api/auth/code', { headers: { ...sameOrigin, 'x-request-id': 'x' } }),
        )
      ).status,
    ).toBe(403);
  });

  it.each(['application/x-www-form-urlencoded', 'multipart/form-data; boundary=x', 'text/plain'])(
    'rejects %s bodies with 415',
    async (contentType) => {
      const response = await proxy(
        apiRequest('/api/auth/code', { headers: { ...sameOrigin, 'content-type': contentType } }),
      );
      expect(response.status).toBe(415);
      expect(await response.json()).toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE' });
    },
  );

  it.each(['PUT', 'PATCH', 'DELETE'])('applies the same checks to %s', async (method) => {
    const response = await proxy(
      apiRequest('/api/auth/code', {
        method,
        headers: { ...sameOrigin, origin: 'https://evil.example' },
      }),
    );
    expect(response.status).toBe(403);
  });

  it('does not apply CSRF checks to safe methods (they never mutate)', async () => {
    const response = await proxy(
      apiRequest('/api/health', { method: 'GET', headers: { origin: 'https://evil.example' } }),
    );
    expect(passedThrough(response)).toBe(true);
  });

  it('never emits CORS headers', async () => {
    const responses = await Promise.all([
      proxy(apiRequest('/api/auth/code', { headers: sameOrigin })),
      proxy(
        apiRequest('/api/auth/code', {
          headers: { ...sameOrigin, origin: 'https://evil.example' },
        }),
      ),
      proxy(
        apiRequest('/api/health', { method: 'GET', headers: { origin: 'https://evil.example' } }),
      ),
    ]);
    for (const response of responses) {
      expect(response.headers.get('access-control-allow-origin')).toBeNull();
      expect(response.headers.get('access-control-allow-credentials')).toBeNull();
    }
  });
});

describe('[TC-INT-13][NFR-04] correlation ID on every response', () => {
  it('generates an ID when the request has none, forwards it and returns it', async () => {
    const response = await proxy(new NextRequest(new URL('/login', ORIGIN)));
    const id = response.headers.get('x-request-id');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('x-middleware-request-x-request-id')).toBe(id);
  });

  it('adds a nonce-based CSP to pages and not to APIs', async () => {
    const page = await proxy(new NextRequest(new URL('/login', ORIGIN)));
    const csp = page.headers.get('content-security-policy') ?? '';
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(page.headers.get('x-middleware-request-content-security-policy')).toBe(csp);

    const api = await proxy(apiRequest('/api/health', { method: 'GET' }));
    expect(api.headers.get('content-security-policy')).toBeNull();
  });
});
