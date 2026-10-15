import { isValidRequestId, REQUEST_ID_HEADER } from '@/shared/lib/observability/request-id';

export const STATE_CHANGING_METHODS: ReadonlySet<string> = new Set([
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

export type CsrfRejection = {
  readonly code: 'CSRF_REJECTED' | 'UNSUPPORTED_MEDIA_TYPE';
  readonly reason: 'origin_mismatch' | 'cross_site' | 'missing_request_id' | 'not_json';
};

/**
 * CSRF layers 2 and 3 (ADR-004) for state-changing API requests. Layer 1 is the cookie's
 * SameSite, layer 4 is never emitting CORS headers, layer 5 is GET never mutating.
 * Returns null when the request may continue.
 */
export function checkCsrf(headers: Headers, appOrigin: string): CsrfRejection | null {
  const origin = headers.get('origin');
  if (origin !== null) {
    if (origin !== appOrigin) return { code: 'CSRF_REJECTED', reason: 'origin_mismatch' };
  } else if (headers.get('sec-fetch-site') !== 'same-origin') {
    // No Origin: only a browser's own same-origin fetch metadata is accepted.
    return { code: 'CSRF_REJECTED', reason: 'cross_site' };
  }
  // HTML forms cannot send custom headers or JSON without a preflight we never grant.
  if (!isValidRequestId(headers.get(REQUEST_ID_HEADER))) {
    return { code: 'CSRF_REJECTED', reason: 'missing_request_id' };
  }
  const contentType = headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('application/json')) {
    return { code: 'UNSUPPORTED_MEDIA_TYPE', reason: 'not_json' };
  }
  return null;
}
