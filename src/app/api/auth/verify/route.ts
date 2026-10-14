import { z } from 'zod';
import { getConfig } from '@/lib/config';
import { errorResponse, jsonOk, parseJsonBody, withApi } from '@/server/http';
import { logForcedOutcome, readForcedOutcome } from '@/server/mock/controls';
import { AUTH_VERIFY_OUTCOMES, getAuthService } from '@/server/services/auth.service';

const ROUTE = '/api/auth/verify';
const Body = z.strictObject({
  identifier: z.string().max(254),
  code: z.string().max(20),
  timeZone: z.string().max(64).optional(),
  returnTo: z.string().max(2048).optional(),
});

/** Verifies the code and starts the session (TS-01 §5, ADR-004). */
export const POST = withApi(ROUTE, async (request, { requestId }) => {
  const forced = readForcedOutcome(
    request.headers,
    AUTH_VERIFY_OUTCOMES,
    getConfig().mockControlsEnabled,
  );
  logForcedOutcome(forced, ROUTE);

  const body = await parseJsonBody(request, Body);
  if (!body.ok) return errorResponse(body.error, requestId);

  const result = await getAuthService().verifyCode(body.value, forced.value);
  if (!result.ok) return errorResponse(result.error, requestId);

  const { setCookie, ...data } = result.value;
  const response = jsonOk(data, requestId);
  response.headers.append('set-cookie', setCookie);
  return response;
});
