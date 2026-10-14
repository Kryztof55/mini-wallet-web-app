import 'server-only';
import type { ErrorCode } from '@/core/errors';

/** Error code → HTTP status (TS-00 §5.2). Exhaustive: adding a code without a status fails to compile. */
export const HTTP_STATUS_BY_CODE: Readonly<Record<ErrorCode, number>> = {
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
};

/**
 * Safe, generic messages. The UI never shows them: it picks copy by `code` (TS-00 §5.3).
 * They exist for API consumers and logs, and never reveal internals.
 */
const MESSAGES: Readonly<Record<number, string>> = {
  400: 'The request is not valid.',
  401: 'Authentication is required.',
  403: 'The request was rejected.',
  404: 'Not found.',
  409: 'The request conflicts with a previous one.',
  413: 'The request is too large.',
  415: 'Unsupported media type.',
  422: 'The request could not be processed.',
  429: 'Too many requests.',
  500: 'Something went wrong.',
  503: 'The service is temporarily unavailable.',
};

export function messageForStatus(status: number): string {
  return MESSAGES[status] ?? 'Something went wrong.';
}
