import type { Brand } from './brand';

/** A same-origin relative path that is safe to redirect to after login (ADR-001). */
export type SafeReturnTo = Brand<string, 'SafeReturnTo'>;

const FALLBACK = '/' as SafeReturnTo;
const PROBE_ORIGIN = 'http://return-to.invalid';

/**
 * Prevents open redirects: accepts only relative paths on our own origin and never `/login`.
 * Anything else falls back to Home.
 */
export function sanitizeReturnTo(raw: string | null | undefined): SafeReturnTo {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return FALLBACK;

  if (/[\u0000-\u001F\u007F]/.test(raw)) return FALLBACK;

  // A path starting with a single "/" always parses against a valid base; only the origin can change.
  const url = new URL(raw, PROBE_ORIGIN);
  if (url.origin !== PROBE_ORIGIN) return FALLBACK;
  if (url.pathname === '/login' || url.pathname.startsWith('/login/')) return FALLBACK;

  return `${url.pathname}${url.search}` as SafeReturnTo;
}
