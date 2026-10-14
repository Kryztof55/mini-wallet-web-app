import 'server-only';
import type { SessionId } from '@/core/ids';

/**
 * Signed opaque session cookie (ADR-004): `<sessionId>.<HMAC-SHA-256>`, base64url.
 * Web Crypto only, so the proxy and server code share it. Verification uses
 * `crypto.subtle.verify`, which compares in constant time.
 */
export const SESSION_COOKIE = 'session';

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const encoder = new TextEncoder();
const keys = new Map<string, Promise<CryptoKey>>();

function hmacKey(secret: string): Promise<CryptoKey> {
  let key = keys.get(secret);
  if (!key) {
    key = crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    keys.set(secret, key);
  }
  return key;
}

const toBase64Url = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64url');

/** 256 random bits (TS-01 §4). */
export function newSessionId(): SessionId {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32))) as SessionId;
}

export async function signSessionId(id: SessionId, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(id));
  return `${id}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Returns the session ID when the cookie is well formed and correctly signed; otherwise null. */
export async function verifySessionCookie(
  value: string | null | undefined,
  secret: string,
): Promise<SessionId | null> {
  if (!value) return null;
  const [id, signature, ...rest] = value.split('.');
  if (!id || !signature || rest.length > 0) return null;
  if (!SESSION_ID_PATTERN.test(id) || !SIGNATURE_PATTERN.test(signature)) return null;

  const signatureBytes = new Uint8Array(Buffer.from(signature, 'base64url'));
  // The last base64url character carries 2 unused bits, so several spellings decode to the
  // same bytes; only the canonical one is accepted.
  if (toBase64Url(signatureBytes) !== signature) return null;
  const valid = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    signatureBytes,
    encoder.encode(id),
  );
  return valid ? (id as SessionId) : null;
}

export type CookieOptions = {
  readonly httpOnly: boolean;
  readonly secure: boolean;
  readonly sameSite: 'lax';
  readonly path: string;
  readonly maxAge?: number;
};

/** `HttpOnly; SameSite=Lax; Path=/`; `Secure` whenever the app origin is https (TS-01 §10). */
export function sessionCookieOptions(appOrigin: string): CookieOptions {
  return { httpOnly: true, secure: appOrigin.startsWith('https://'), sameSite: 'lax', path: '/' };
}

/** `Set-Cookie` value for Route Handlers, which build their own `Response`. */
export function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [`${name}=${value}`, `Path=${options.path}`, 'SameSite=Lax'];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

/** Reads one cookie from a `Cookie` request header. */
export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}
