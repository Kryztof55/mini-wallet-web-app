import { NextResponse, type NextRequest } from 'next/server';
import { domainError } from '@/core/common';
import { sanitizeReturnTo } from '@/core/auth';
import { getConfig } from '@/shared/lib/config';
import { ensureRequestId, REQUEST_ID_HEADER } from '@/shared/lib/observability/request-id';
import { HOME_PATH, LOGIN_PATH, loginUrl, RETURN_TO_HEADER } from '@/shared/lib/routes';
import { errorResponse } from '@/server/http/respond';
import { runWithRequestContext } from '@/server/logging/context';
import { logEvent } from '@/server/logging/logger';
import { contentSecurityPolicy, newNonce } from '@/server/security/csp';
import { checkCsrf, STATE_CHANGING_METHODS } from '@/server/security/csrf';
import { classifyRoute } from '@/server/security/routes';
import { SESSION_COOKIE, verifySessionCookie } from '@/server/session/cookie';

/**
 * First barrier for every request (TS-01 §10, ADR-001, ADR-004), in this order:
 * 1. correlation ID (reuse a valid one, else generate) on request and response;
 * 2. CSRF layers 2–3 for state-changing API requests;
 * 3. session cookie signature for private pages (→ /login?returnTo) and APIs (→ 401);
 * 4. /login with a valid cookie → back to where the user was going.
 * It never reads the session store: `getSession()` in layouts and controllers is the
 * authority, so skipping the proxy cannot grant access.
 */
export async function proxy(request: NextRequest): Promise<Response> {
  const requestId = ensureRequestId(request.headers.get(REQUEST_ID_HEADER));
  return runWithRequestContext({ requestId }, () => gate(request, requestId));
}

async function gate(request: NextRequest, requestId: string): Promise<Response> {
  const config = getConfig();
  const { pathname, search, searchParams } = request.nextUrl;
  const kind = classifyRoute(pathname);
  const isApi = kind === 'public-api' || kind === 'private-api';

  if (isApi && STATE_CHANGING_METHODS.has(request.method)) {
    const rejection = checkCsrf(request.headers, config.appOrigin);
    if (rejection) {
      logEvent('warn', 'security.csrf.rejected', {
        route: pathname,
        method: request.method,
        reason: rejection.reason,
      });
      return errorResponse(domainError(rejection.code), requestId);
    }
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  const hasSession = (await verifySessionCookie(cookieValue, config.sessionSecret)) !== null;

  if (kind === 'private-api' && !hasSession) {
    logEvent('info', 'auth.session.rejected', { layer: 'proxy', route: pathname });
    return errorResponse(domainError('UNAUTHENTICATED'), requestId);
  }

  if (kind === 'private-page' && !hasSession) {
    const returnTo = sanitizeReturnTo(`${pathname}${search}`);
    // A cookie that fails verification means a session existed and is no longer valid.
    const reason = cookieValue ? 'session_ended' : undefined;
    return redirect(request, loginUrl({ returnTo, reason }), requestId);
  }

  // `reason` means the server already found the session invalid: show login, don't bounce.
  if (pathname === LOGIN_PATH && hasSession && !searchParams.has('reason')) {
    return redirect(
      request,
      sanitizeReturnTo(searchParams.get('returnTo')) || HOME_PATH,
      requestId,
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  let csp: string | null = null;
  if (!isApi) {
    csp = contentSecurityPolicy({
      nonce: newNonce(),
      dev: process.env.NODE_ENV === 'development',
      https: config.appOrigin.startsWith('https://'),
    });
    requestHeaders.set('content-security-policy', csp);
    requestHeaders.set(RETURN_TO_HEADER, `${pathname}${search}`);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  if (csp) response.headers.set('content-security-policy', csp);
  return response;
}

function redirect(request: NextRequest, path: string, requestId: string): Response {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  // Everything except build assets and static files.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
