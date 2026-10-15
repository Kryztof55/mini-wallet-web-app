/** Public route paths shared by the proxy, server redirects and the browser client. */
export const LOGIN_PATH = '/login';
export const HOME_PATH = '/';

/** Set by the proxy so private layouts can redirect back to the requested page. */
export const RETURN_TO_HEADER = 'x-return-to';

export type LoginReason = 'session_ended' | 'logged_out';

/**
 * `/login?reason=…&returnTo=…`. `returnTo` must already be sanitized (`sanitizeReturnTo`);
 * Home is the default, so it is omitted.
 */
export function loginUrl({
  returnTo,
  reason,
}: { readonly returnTo?: string | null; readonly reason?: LoginReason } = {}): string {
  const params = new URLSearchParams();
  if (reason) params.set('reason', reason);
  if (returnTo && returnTo !== HOME_PATH) params.set('returnTo', returnTo);
  const query = params.toString();
  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}

/** Home query parameter that highlights a just-completed transfer (UIR-HOME-11). */
export const HIGHLIGHT_PARAM = 'highlight';
