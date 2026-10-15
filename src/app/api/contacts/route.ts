import { z } from 'zod';
import { getConfig } from '@/shared/lib/config';
import { errorResponse, jsonOk, parseJsonBody, withApi } from '@/server/http';
import { withSession } from '@/server/http/with-session';
import { logForcedOutcome, readForcedOutcome } from '@/server/mock/controls';
import { CONTACTS_OUTCOMES, getContactsService } from '@/server/services/contacts.service';

const ROUTE = '/api/contacts';
const CreateBody = z.strictObject({
  name: z.string().max(200),
  identifier: z.string().max(254),
});

function forcedOutcome(request: Request) {
  const forced = readForcedOutcome(
    request.headers,
    CONTACTS_OUTCOMES,
    getConfig().mockControlsEnabled,
  );
  logForcedOutcome(forced, ROUTE);
  return forced.value;
}

/** Favorites, most recently used first (TS-03 §5). */
export const GET = withApi(
  ROUTE,
  withSession(async (request, { requestId, session }) => {
    const result = await getContactsService().list(session.userId, forcedOutcome(request));
    return result.ok
      ? jsonOk({ items: result.value }, requestId)
      : errorResponse(result.error, requestId);
  }),
);

/** Saves a favorite: 201 new, 200 when the identifier is already saved (BR-08). */
export const POST = withApi(
  ROUTE,
  withSession(async (request, { requestId, session }) => {
    const forced = forcedOutcome(request);
    const body = await parseJsonBody(request, CreateBody);
    if (!body.ok) return errorResponse(body.error, requestId);
    const result = await getContactsService().create(session.userId, body.value, forced);
    if (!result.ok) return errorResponse(result.error, requestId);
    return jsonOk(result.value, requestId, result.value.created ? 201 : 200);
  }),
);
