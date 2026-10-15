import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { UserId } from '@/core/ids';
import { getConfig } from '@/shared/lib/config';
import { setContextUserId } from '@/server/logging/context';
import { getRepositories } from '@/server/repositories';
import type { Session } from '@/server/repositories/ports';
import {
  newSessionId,
  readCookie,
  serializeCookie,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionId,
  verifySessionCookie,
} from './cookie';

/**
 * Session authority (BR-14, ADR-004): a session exists only if the cookie signature is valid
 * AND the server-side record exists. The proxy checks only the signature (first barrier);
 * private layouts and controllers call these functions, so a bypassed proxy changes nothing.
 */
export async function resolveSession(
  cookieValue: string | null | undefined,
): Promise<Session | null> {
  const sessionId = await verifySessionCookie(cookieValue, getConfig().sessionSecret);
  if (!sessionId) return null;
  const session = await getRepositories().sessions.get(sessionId);
  if (session) setContextUserId(session.userId);
  return session;
}

/** For Server Components and layouts; cached so the layout and the page share one lookup. */
export const getSession = cache(async (): Promise<Session | null> =>
  resolveSession((await cookies()).get(SESSION_COOKIE)?.value),
);

/** For Route Handlers, which receive the raw request. */
export function getSessionFromRequest(request: Request): Promise<Session | null> {
  return resolveSession(readCookie(request.headers.get('cookie'), SESSION_COOKIE));
}

/** Creates the record and returns the `Set-Cookie` value for the response (used by login). */
export async function createSession(
  userId: UserId,
  timeZone: string,
  now: Date = new Date(),
): Promise<{ readonly session: Session; readonly setCookie: string }> {
  const { sessionSecret, appOrigin } = getConfig();
  const session: Session = { id: newSessionId(), userId, timeZone, createdAt: now.toISOString() };
  await getRepositories().sessions.create(session);
  const value = await signSessionId(session.id, sessionSecret);
  return {
    session,
    setCookie: serializeCookie(SESSION_COOKIE, value, sessionCookieOptions(appOrigin)),
  };
}

/** Deletes the record and returns the `Set-Cookie` value that clears the cookie (logout). */
export async function destroySession(session: Session | null): Promise<string> {
  if (session) await getRepositories().sessions.delete(session.id);
  return serializeCookie(SESSION_COOKIE, '', {
    ...sessionCookieOptions(getConfig().appOrigin),
    maxAge: 0,
  });
}
