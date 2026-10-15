import { LOGIN_PATH } from '@/shared/lib/routes';

export type RouteKind = 'public-page' | 'private-page' | 'public-api' | 'private-api';

/** APIs reachable without a session. Everything else under /api is private by default. */
const PUBLIC_API_PREFIXES = [
  '/api/health',
  '/api/auth/code',
  '/api/auth/verify',
  '/api/auth/logout',
  '/api/client-logs',
  '/api/mock/',
] as const;

const PUBLIC_PAGES: ReadonlySet<string> = new Set([LOGIN_PATH]);

/** Secure by default: an unknown page or API is private. */
export function classifyRoute(pathname: string): RouteKind {
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))
      ? 'public-api'
      : 'private-api';
  }
  return PUBLIC_PAGES.has(pathname) ? 'public-page' : 'private-page';
}
