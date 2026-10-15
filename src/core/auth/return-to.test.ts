import { describe, expect, it } from 'vitest';
import { sanitizeReturnTo } from './return-to';

describe('[TC-UNIT-14][ADR-001][UIR-AUTH-14] sanitizeReturnTo', () => {
  it.each(['/transfer/amount', '/receipts/abc123', '/?highlight=t1', '/'])(
    'keeps safe path %j',
    (path) => {
      expect(sanitizeReturnTo(path)).toBe(path);
    },
  );

  it.each([
    null,
    undefined,
    '',
    'transfer',
    '//evil.com/path',
    '/\\evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    '/login',
    '/login?returnTo=/x',
    '/path\nwith-newline',
  ])('falls back to Home for %j', (raw) => {
    expect(sanitizeReturnTo(raw)).toBe('/');
  });
});
