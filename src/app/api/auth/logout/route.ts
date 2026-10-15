import { noContent, withApi } from '@/server/http';
import { getAuthService } from '@/server/services/auth.service';
import { getSessionFromRequest } from '@/server/session/session';

/** Ends the session (FR-AUTH-10). POST only, never GET (ADR-004 layer 5); idempotent. */
export const POST = withApi('/api/auth/logout', async (request, { requestId }) => {
  const setCookie = await getAuthService().logout(await getSessionFromRequest(request));
  const response = noContent(requestId);
  response.headers.append('set-cookie', setCookie);
  return response;
});
