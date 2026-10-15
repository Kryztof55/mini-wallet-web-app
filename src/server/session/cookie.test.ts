import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SessionId } from '@/core/common';
import {
  newSessionId,
  readCookie,
  serializeCookie,
  sessionCookieOptions,
  signSessionId,
  verifySessionCookie,
} from './cookie';

const SECRET = 'a'.repeat(32);
const OTHER_SECRET = 'b'.repeat(32);

afterEach(() => vi.restoreAllMocks());

describe('[TC-UNIT-15][ADR-004][BR-14] session cookie signing', () => {
  it('creates 256-bit random, URL-safe session IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newSessionId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('round-trips: a signed cookie verifies to its session ID', async () => {
    const id = newSessionId();
    const cookie = await signSessionId(id, SECRET);
    expect(cookie.startsWith(`${id}.`)).toBe(true);
    expect(await verifySessionCookie(cookie, SECRET)).toBe(id);
  });

  it('rejects a tampered session ID', async () => {
    const cookie = await signSessionId(newSessionId(), SECRET);
    const [, signature] = cookie.split('.');
    const forged = `${newSessionId()}.${signature}`;
    expect(await verifySessionCookie(forged, SECRET)).toBeNull();
  });

  it('rejects a tampered signature', async () => {
    const id = newSessionId();
    const cookie = await signSessionId(id, SECRET);
    const at = id.length + 5;
    const flipped = cookie[at] === 'A' ? 'B' : 'A';
    expect(
      await verifySessionCookie(`${cookie.slice(0, at)}${flipped}${cookie.slice(at + 1)}`, SECRET),
    ).toBeNull();
  });

  it('rejects a non-canonical spelling of a valid signature', async () => {
    // Flipping the unused low bits of the last character keeps the decoded bytes identical.
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    for (let i = 0; i < 20; i += 1) {
      const cookie = await signSessionId(newSessionId(), SECRET);
      const last = ALPHABET.indexOf(cookie.at(-1) ?? 'A');
      const sibling = ALPHABET[last ^ 1] ?? 'A';
      expect(await verifySessionCookie(`${cookie.slice(0, -1)}${sibling}`, SECRET)).toBeNull();
    }
  });

  it('rejects a cookie signed with another secret', async () => {
    const cookie = await signSessionId(newSessionId(), OTHER_SECRET);
    expect(await verifySessionCookie(cookie, SECRET)).toBeNull();
  });

  it.each([
    undefined,
    null,
    '',
    'no-dot',
    '.',
    'a.b',
    `${'x'.repeat(43)}.${'y'.repeat(43)}.extra`,
    `${'x'.repeat(42)}!.${'y'.repeat(43)}`,
  ])('rejects malformed values: %o', async (value) => {
    expect(await verifySessionCookie(value, SECRET)).toBeNull();
  });

  it('verifies with crypto.subtle.verify (constant-time), never a string compare', async () => {
    const verify = vi.spyOn(crypto.subtle, 'verify');
    const id = newSessionId();
    await verifySessionCookie(await signSessionId(id as SessionId, SECRET), SECRET);
    expect(verify).toHaveBeenCalledOnce();
  });

  it('builds HttpOnly SameSite=Lax cookies, Secure on https', () => {
    expect(serializeCookie('session', 'v', sessionCookieOptions('https://wallet.mx'))).toBe(
      'session=v; Path=/; SameSite=Lax; HttpOnly; Secure',
    );
    expect(
      serializeCookie('session', '', {
        ...sessionCookieOptions('http://localhost:3000'),
        maxAge: 0,
      }),
    ).toBe('session=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0');
  });

  it('reads one cookie from a Cookie header', () => {
    expect(readCookie('theme=dark; session=abc.def; x=1', 'session')).toBe('abc.def');
    expect(readCookie('theme=dark', 'session')).toBeNull();
    expect(readCookie(null, 'session')).toBeNull();
  });
});
