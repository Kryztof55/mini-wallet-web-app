/**
 * Closed catalog of error codes (TS-00 §5.2). HTTP mapping lives in the server layer;
 * user-facing copy is chosen by code in the UI (i18n keys), never from server messages.
 */
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'CSRF_REJECTED',
  'NOT_FOUND',
  'IDEMPOTENCY_KEY_REUSED',
  'UNSUPPORTED_MEDIA_TYPE',
  'INVALID_IDENTIFIER',
  'INVALID_CODE_FORMAT',
  'CODE_INCORRECT',
  'CODE_EXPIRED',
  'CODE_LOCKED',
  'INVALID_AMOUNT',
  'INSUFFICIENT_FUNDS',
  'RECIPIENT_REQUIRED',
  'SELF_TRANSFER',
  'INVALID_CONCEPT',
  'INVALID_CONTACT_NAME',
  'CODE_THROTTLED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'NETWORK_UNAVAILABLE',
  'SERVICE_UNAVAILABLE',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Codes produced only by the browser HTTP client (no server response). */
export type ClientOnlyErrorCode = 'NETWORK_ERROR' | 'TIMEOUT';

export type ErrorDetails = Readonly<Record<string, string | number | boolean | null>>;

export type DomainError<C extends ErrorCode = ErrorCode> = {
  readonly code: C;
  readonly details?: ErrorDetails;
};

export function domainError<C extends ErrorCode>(code: C, details?: ErrorDetails): DomainError<C> {
  return details === undefined ? { code } : { code, details };
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && (ERROR_CODES as readonly string[]).includes(value);
}
