import { z } from 'zod';
import { domainError } from '@/core/errors';
import { getConfig } from '@/lib/config';
import { errorResponse, jsonOk, withApi } from '@/server/http';
import { withSession } from '@/server/http/with-session';
import { logForcedOutcome, readForcedOutcome } from '@/server/mock/controls';
import { getAccountService, HOME_OUTCOMES } from '@/server/services/account.service';

const ROUTE = '/api/me/transactions';
/** Any integer is accepted and clamped by the service to 1…ACTIVITY_LIMIT (FR-HOME-10). */
const Limit = z.coerce.number().int().optional();

/** Recent activity (TS-02 §5): Home section retry. */
export const GET = withApi(
  ROUTE,
  withSession(async (request, { requestId, session }) => {
    const raw = new URL(request.url).searchParams.get('limit');
    const limit = Limit.safeParse(raw ?? undefined);
    if (!limit.success) {
      return errorResponse(domainError('VALIDATION_ERROR', { field: 'limit' }), requestId);
    }
    const forced = readForcedOutcome(
      request.headers,
      HOME_OUTCOMES,
      getConfig().mockControlsEnabled,
    );
    logForcedOutcome(forced, ROUTE);
    const result = await getAccountService().getRecentTransactions(
      session.userId,
      limit.data,
      forced.value,
    );
    return result.ok
      ? jsonOk({ items: result.value }, requestId)
      : errorResponse(result.error, requestId);
  }),
);
