import 'server-only';
import { ensureRequestId, REQUEST_ID_HEADER } from '@/lib/observability/request-id';
import { runWithRequestContext } from '@/server/logging/context';
import { logEvent } from '@/server/logging/logger';
import { internalErrorResponse } from './respond';

export type ApiContext = { readonly requestId: string };

type RouteHandler<Args extends unknown[]> = (request: Request, ...args: Args) => Promise<Response>;

/**
 * Wraps a Route Handler (controller) with the cross-cutting concerns of TS-00 §5.3 and TS-05:
 * correlation ID, request context, one `http.request.completed` line per request, and a
 * generic 500 for unexpected exceptions (logged with the stack). Expected failures never throw:
 * services return `Result` and controllers map them with `errorResponse`.
 */
export function withApi<Args extends unknown[]>(
  route: string,
  handler: (request: Request, context: ApiContext, ...args: Args) => Promise<Response>,
): RouteHandler<Args> {
  return (request, ...args) => {
    const requestId = ensureRequestId(request.headers.get(REQUEST_ID_HEADER));
    const startedAt = performance.now();
    return runWithRequestContext({ requestId }, async () => {
      let response: Response;
      let thrown: unknown;
      try {
        response = await handler(request, { requestId }, ...args);
      } catch (error) {
        thrown = error;
        response = internalErrorResponse(requestId);
      }
      if (!response.headers.has(REQUEST_ID_HEADER))
        response.headers.set(REQUEST_ID_HEADER, requestId);
      const errorCode = response.status >= 400 ? await peekErrorCode(response) : undefined;
      logEvent(response.status >= 500 ? 'error' : 'info', 'http.request.completed', {
        route,
        method: request.method,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
        ...(errorCode ? { errorCode } : {}),
        ...(thrown === undefined ? {} : { err: thrown }),
      });
      return response;
    });
  };
}

async function peekErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.clone().json();
    return typeof body === 'object' &&
      body !== null &&
      'code' in body &&
      typeof body.code === 'string'
      ? body.code
      : undefined;
  } catch {
    return undefined;
  }
}
