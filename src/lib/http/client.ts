import type { z } from 'zod';
import type { ClientOnlyErrorCode, ErrorCode, ErrorDetails } from '@/core/errors';
import { isErrorCode } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { newRequestId, REQUEST_ID_HEADER } from '@/lib/observability/request-id';

/**
 * Browser HTTP client (TS-00 §5.3). Every call resolves to a `Result`: it never throws.
 * The `requestId` travels with success and failure so the UI can show a reference code
 * even when the server never answered (TS-05 §11.4).
 */

export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
export const DEFAULT_TIMEOUT_MS = 15_000;

export type ClientErrorCode = ErrorCode | ClientOnlyErrorCode;

export type ClientError = {
  readonly code: ClientErrorCode;
  readonly status: number | null;
  readonly requestId: string;
  readonly details?: ErrorDetails;
};

export type ClientSuccess<T> = {
  readonly data: T;
  readonly status: number;
  readonly requestId: string;
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions<S extends z.ZodType | undefined> = {
  readonly body?: unknown;
  /** Response body schema. Omit for empty (204) responses. */
  readonly schema?: S;
  readonly timeoutMs?: number;
  readonly idempotencyKey?: string;
  /** Reuse an ID (e.g. a status check correlated with the original attempt). */
  readonly requestId?: string;
  /** Caller cancellation (unmount, navigation). Resolves to `ABORTED`, never shown to users. */
  readonly signal?: AbortSignal;
};

type Data<S> = S extends z.ZodType ? z.infer<S> : null;

export type HttpClientDeps = {
  readonly fetch: typeof fetch;
  /** Called once per 401 so the app can end the session and go to login (BR-14). */
  readonly onUnauthenticated: () => void;
};

const defaultDeps: HttpClientDeps = {
  fetch: (...args) => globalThis.fetch(...args),
  onUnauthenticated: redirectToLogin,
};

export function createHttpClient(deps: HttpClientDeps = defaultDeps) {
  return async function request<S extends z.ZodType | undefined = undefined>(
    method: HttpMethod,
    path: string,
    options: RequestOptions<S> = {},
  ): Promise<Result<ClientSuccess<Data<S>>, ClientError>> {
    const requestId = options.requestId ?? newRequestId();
    const fail = (code: ClientErrorCode, status: number | null = null, details?: ErrorDetails) =>
      err<ClientError>({ code, status, requestId, ...(details ? { details } : {}) });

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const onCallerAbort = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    options.signal?.addEventListener('abort', onCallerAbort, { once: true });

    const headers: Record<string, string> = {
      accept: 'application/json',
      [REQUEST_ID_HEADER]: requestId,
    };
    if (options.body !== undefined) headers['content-type'] = 'application/json';
    if (options.idempotencyKey) headers[IDEMPOTENCY_KEY_HEADER] = options.idempotencyKey;

    let response: Response;
    let payload: unknown;
    try {
      response = await deps.fetch(path, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
      });
      payload = response.status === 204 ? null : await readJson(response);
    } catch {
      if (timedOut) return fail('TIMEOUT');
      if (controller.signal.aborted) return fail('ABORTED');
      return fail('NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onCallerAbort);
    }

    if (!response.ok) {
      if (response.status === 401) deps.onUnauthenticated();
      const body = isRecord(payload) ? payload : {};
      const code = isErrorCode(body.code) ? body.code : fallbackCode(response.status);
      const details = isRecord(body.details) ? (body.details as ErrorDetails) : undefined;
      return fail(code, response.status, details);
    }

    if (!options.schema) return ok({ data: null as Data<S>, status: response.status, requestId });
    const parsed = options.schema.safeParse(payload);
    // A 2xx that breaks the contract is a bug on our side, not something the user can fix.
    if (!parsed.success) return fail('INTERNAL_ERROR', response.status);
    return ok({ data: parsed.data as Data<S>, status: response.status, requestId });
  };
}

export type HttpRequest = ReturnType<typeof createHttpClient>;

/** App-wide client. Tests build their own with `createHttpClient`. */
export const request: HttpRequest = createHttpClient();

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** For responses without a catalog body (e.g. a proxy or platform error page). */
function fallbackCode(status: number): ErrorCode {
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 503) return 'SERVICE_UNAVAILABLE';
  return 'INTERNAL_ERROR';
}

let redirecting = false;

function redirectToLogin(): void {
  if (typeof window === 'undefined' || redirecting) return;
  redirecting = true;
  const { pathname, search } = window.location;
  const returnTo = encodeURIComponent(`${pathname}${search}`);
  // A full navigation on purpose: it drops every in-memory client state (transfer draft,
  // caches) that belonged to the ended session. The router would keep it alive.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?reason=session_ended&returnTo=${returnTo}`);
}
