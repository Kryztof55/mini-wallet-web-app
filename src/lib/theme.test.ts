import { describe, expect, it } from 'vitest';
import { interpolate, t } from './i18n/t';
import { isThemePreference, resolveThemePreference } from './theme';

describe('[UX-22] theme preference', () => {
  it.each(['system', 'light', 'dark'])('accepts %s', (value) => {
    expect(isThemePreference(value)).toBe(true);
    expect(resolveThemePreference(value)).toBe(value);
  });

  it.each([undefined, '', 'blue', 'DARK'])('falls back to system for %o', (value) => {
    expect(resolveThemePreference(value)).toBe('system');
  });
});

describe('t()', () => {
  it('returns es-MX copy by key', () => {
    expect(t('theme.dark')).toBe('Oscuro');
  });

  it('interpolates params and leaves unknown placeholders visible', () => {
    expect(interpolate('Referencia: {code}', { code: '3F9A-12C4' })).toBe('Referencia: 3F9A-12C4');
    expect(interpolate('Te quedan {n} intentos.', { n: 2 })).toBe('Te quedan 2 intentos.');
    expect(interpolate('Hola {name}', {})).toBe('Hola {name}');
    expect(interpolate('Sin parámetros')).toBe('Sin parámetros');
  });
});
