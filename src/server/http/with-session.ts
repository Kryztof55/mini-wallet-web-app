import 'server-only';
import { domainError } from '@/core/errors';
import { logEvent } from '@/server/logging/logger';
import type { Session } from '@/server/repositories/ports';
import { getSessionFromRequest } from '@/server/session/session';
import type { ApiContext } from './handler';
import { errorResponse } from './respond';

export type SessionContext = ApiContext & { readonly session: Session };

/**
 * Authority check for private controllers (TS-01 §10): runs even if the proxy was skipped.
 * Use inside `withApi`: `withApi(route, withSession(async (req, { session }) => …))`.
 */
export function withSession<Args extends unknown[]>(
  handler: (request: Request, context: SessionContext, ...args: Args) => Promise<Response>,
): (request: Request, context: ApiContext, ...args: Args) => Promise<Response> {
  return async (request, context, ...args) => {
    const session = await getSessionFromRequest(request);
    if (!session) {
      logEvent('info', 'auth.session.rejected', { layer: 'controller' });
      return errorResponse(domainError('UNAUTHENTICATED'), context.requestId);
    }
    return handler(request, { ...context, session }, ...args);
  };
}
