import 'server-only';
import { domainError, type DomainError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import {
  isThemePreference,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE_SEC,
  type ThemePreference,
} from '@/lib/theme';

/** The subset of Next's cookie store the service needs; keeps the service framework-free. */
export type CookieWriter = {
  set(
    name: string,
    value: string,
    options: {
      path: string;
      maxAge: number;
      sameSite: 'lax';
      secure: boolean;
      httpOnly: boolean;
    },
  ): unknown;
};

/**
 * Persists the theme preference (ADR-007). The cookie is readable by scripts on purpose:
 * it holds no sensitive data and lets the client stay in sync. `Secure` follows the origin's
 * scheme so the cookie also works on http://localhost.
 */
export function setThemePreference(
  cookies: CookieWriter,
  value: unknown,
  options: { secure: boolean },
): Result<ThemePreference, DomainError<'VALIDATION_ERROR'>> {
  if (!isThemePreference(value)) {
    return err(domainError('VALIDATION_ERROR', { field: 'theme' }));
  }
  cookies.set(THEME_COOKIE, value, {
    path: '/',
    maxAge: THEME_COOKIE_MAX_AGE_SEC,
    sameSite: 'lax',
    secure: options.secure,
    httpOnly: false,
  });
  return ok(value);
}
