import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = { readonly requestId: string; userId?: string };

const storage = new AsyncLocalStorage<RequestContext>();

/** Runs `fn` with a per-request context so services can log without passing IDs around (ADR-006). */
export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Called once the session is known, so later log lines carry the user ID. */
export function setContextUserId(userId: string): void {
  const context = storage.getStore();
  if (context) context.userId = userId;
}
