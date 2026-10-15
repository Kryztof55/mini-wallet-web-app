import 'server-only';
import { headers } from 'next/headers';
import { ensureRequestId, REQUEST_ID_HEADER } from '@/shared/lib/observability/request-id';
import { runWithRequestContext } from './context';

/**
 * Request context for Server Components and layouts (TS-05 §3.1): reuses the correlation ID
 * the proxy put on the request, so page logs join the same trace as API logs.
 */
export async function runInPageContext<T>(fn: () => Promise<T>): Promise<T> {
  const requestId = ensureRequestId((await headers()).get(REQUEST_ID_HEADER));
  return runWithRequestContext({ requestId }, fn);
}
