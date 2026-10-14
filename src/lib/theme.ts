/**
 * Theme preference (ADR-007). Shared by the root layout, the Server Action and the client
 * provider; framework-free so every layer can use it.
 */
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const THEME_COOKIE = 'theme';
export const THEME_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;
export const DEFAULT_THEME: ThemePreference = 'system';

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** Unknown or missing cookie values fall back to following the OS. */
export function resolveThemePreference(value: string | undefined): ThemePreference {
  return isThemePreference(value) ? value : DEFAULT_THEME;
}
