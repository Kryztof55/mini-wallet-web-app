/**
 * Correlation IDs (ADR-006, TS-05). Shared by the proxy, server code and the browser HTTP client.
 */
export const REQUEST_ID_HEADER = 'x-request-id';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidRequestId(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function newRequestId(): string {
  return crypto.randomUUID();
}

/** Reuses a well-formed incoming ID (so client and server agree), otherwise generates one. */
export function ensureRequestId(incoming: string | null | undefined): string {
  return isValidRequestId(incoming) ? incoming.toLowerCase() : newRequestId();
}

/** Short, human-friendly reference shown to users: first 8 hex chars, `3F9A-12C4` (TS-05 §11.4). */
export function toReferenceCode(requestId: string): string {
  const hex = requestId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}
