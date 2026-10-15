import { getConfig } from '@/shared/lib/config';
import { errorResponse, jsonOk, withApi } from '@/server/http';
import { withSession } from '@/server/http/with-session';
import { logForcedOutcome, readForcedOutcome } from '@/server/mock/controls';
import { getAccountService, HOME_OUTCOMES } from '@/server/services/account.service';

const ROUTE = '/api/me/summary';

/** Name and balance (TS-02 §5): Home section retry and the transfer amount step. */
export const GET = withApi(
  ROUTE,
  withSession(async (request, { requestId, session }) => {
    const forced = readForcedOutcome(
      request.headers,
      HOME_OUTCOMES,
      getConfig().mockControlsEnabled,
    );
    logForcedOutcome(forced, ROUTE);
    const result = await getAccountService().getSummary(session.userId, forced.value);
    return result.ok ? jsonOk(result.value, requestId) : errorResponse(result.error, requestId);
  }),
);
