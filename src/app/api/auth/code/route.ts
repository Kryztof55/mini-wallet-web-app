import { z } from 'zod';
import { getConfig } from '@/lib/config';
import { errorResponse, jsonOk, parseJsonBody, withApi } from '@/server/http';
import { logForcedOutcome, readForcedOutcome } from '@/server/mock/controls';
import { AUTH_CODE_OUTCOMES, getAuthService } from '@/server/services/auth.service';

const ROUTE = '/api/auth/code';
const Body = z.strictObject({ identifier: z.string().max(254) });

/** Issues a one-time code (TS-01 §5). Public; CSRF-checked by the proxy. */
export const POST = withApi(ROUTE, async (request, { requestId }) => {
  const forced = readForcedOutcome(
    request.headers,
    AUTH_CODE_OUTCOMES,
    getConfig().mockControlsEnabled,
  );
  logForcedOutcome(forced, ROUTE);

  const body = await parseJsonBody(request, Body);
  if (!body.ok) return errorResponse(body.error, requestId);

  const result = await getAuthService().requestCode(body.value.identifier, forced.value);
  return result.ok ? jsonOk(result.value, requestId, 202) : errorResponse(result.error, requestId);
});
