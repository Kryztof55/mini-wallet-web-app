import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetConfigCache } from '@/lib/config';
import { THEME_COOKIE_MAX_AGE_SEC } from '@/lib/theme';
import { setThemeAction } from './set-theme';

const cookieStore = { set: vi.fn() };
vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers(),
}));

function withOrigin(origin: string) {
  vi.stubEnv('SESSION_SECRET', 'x'.repeat(32));
  vi.stubEnv('APP_ORIGIN', origin);
  resetConfigCache();
}

beforeEach(() => {
  cookieStore.set.mockClear();
  withOrigin('http://localhost:3000');
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetConfigCache();
});

describe('[TC-INT-14][ADR-007][UX-22] theme Server Action', () => {
  it.each(['light', 'dark', 'system'] as const)('sets the theme cookie to %s', async (theme) => {
    expect(await setThemeAction(theme)).toEqual({ ok: true, theme });
    expect(cookieStore.set).toHaveBeenCalledWith('theme', theme, {
      path: '/',
      maxAge: THEME_COOKIE_MAX_AGE_SEC,
      sameSite: 'lax',
      secure: false,
      httpOnly: false,
    });
  });

  it('marks the cookie Secure on an https origin', async () => {
    withOrigin('https://wallet.example.mx');
    await setThemeAction('dark');
    expect(cookieStore.set).toHaveBeenCalledWith(
      'theme',
      'dark',
      expect.objectContaining({ secure: true }),
    );
  });

  it.each(['blue', '', null, 1, { theme: 'dark' }])(
    'rejects %o without touching cookies',
    async (value) => {
      expect(await setThemeAction(value)).toEqual({ ok: false, code: 'VALIDATION_ERROR' });
      expect(cookieStore.set).not.toHaveBeenCalled();
    },
  );
});
