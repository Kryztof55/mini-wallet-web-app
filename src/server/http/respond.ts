import 'server-only';
import { domainError, type DomainError } from '@/core/errors';
import { REQUEST_ID_HEADER } from '@/lib/observability/request-id';
import { HTTP_STATUS_BY_CODE, messageForStatus } from './status';

const BASE_HEADERS = { 'Cache-Control': 'no-store' } as const;

export type ApiErrorBody = {
  readonly code: DomainError['code'];
  readonly message: string;
  readonly requestId: string;
  readonly details?: DomainError['details'];
};

export function jsonOk<T>(data: T, requestId: string, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { ...BASE_HEADERS, [REQUEST_ID_HEADER]: requestId },
  });
}

export function noContent(requestId: string): Response {
  return new Response(null, {
    status: 204,
    headers: { ...BASE_HEADERS, [REQUEST_ID_HEADER]: requestId },
  });
}

/** Domain error → HTTP response with the common error body (TS-00 §5.1). */
export function errorResponse(error: DomainError, requestId: string): Response {
  const status = HTTP_STATUS_BY_CODE[error.code];
  const body: ApiErrorBody = {
    code: error.code,
    message: messageForStatus(status),
    requestId,
    ...(error.details ? { details: error.details } : {}),
  };
  const retryAfter = error.details?.retryAfterSec;
  return Response.json(body, {
    status,
    headers: {
      ...BASE_HEADERS,
      [REQUEST_ID_HEADER]: requestId,
      ...(typeof retryAfter === 'number' ? { 'Retry-After': String(retryAfter) } : {}),
    },
  });
}

export function internalErrorResponse(requestId: string): Response {
  return errorResponse(domainError('INTERNAL_ERROR'), requestId);
}
