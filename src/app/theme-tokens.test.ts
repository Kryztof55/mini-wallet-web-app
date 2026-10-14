import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A11Y-10 / NFR-16: every semantic text/background pair meets WCAG contrast in BOTH themes.
 * Reads the real token file, so a palette change that breaks contrast fails here (jsdom
 * cannot compute contrast; E2E axe checks rendered pages too, TC-E2E-21).
 */
const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

function readTokens(): Map<string, { light: string; dark: string }> {
  const tokens = new Map<string, { light: string; dark: string }>();
  for (const match of css.matchAll(
    /--([\w-]+):\s*light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/gi,
  )) {
    const [, name, light, dark] = match;
    if (name && light && dark) tokens.set(name, { light, dark });
  }
  return tokens;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ['surface', 'surface-raised', 'surface-sunken'];
const TEXT = 4.5;
const NON_TEXT = 3;

/** [foreground, background, minimum ratio] */
const PAIRS: [string, string, number][] = [
  ...['text-primary', 'text-secondary', 'text-link', 'amount-in', 'amount-out'].flatMap((fg) =>
    SURFACES.map((bg): [string, string, number] => [fg, bg, TEXT]),
  ),
  ...['success', 'error', 'warning', 'info'].flatMap((status): [string, string, number][] => [
    [`status-${status}`, 'surface', TEXT],
    [`status-${status}`, 'surface-raised', TEXT],
    [`status-${status}`, `status-${status}-surface`, TEXT],
    ['text-primary', `status-${status}-surface`, TEXT],
  ]),
  ['action-primary-text', 'action-primary', TEXT],
  ['action-primary-text', 'action-primary-hover', TEXT],
  ['action-secondary-text', 'action-secondary', TEXT],
  ['action-secondary-text', 'action-secondary-hover', TEXT],
  ['text-inverse', 'action-primary', TEXT],
  ...['border-strong', 'focus-ring', 'action-primary'].flatMap((fg) =>
    SURFACES.map((bg): [string, string, number] => [fg, bg, NON_TEXT]),
  ),
];

describe('[TC-UNIT-24][A11Y-10][NFR-16] theme token contrast', () => {
  const tokens = readTokens();

  it('defines every token used by the checks in both themes', () => {
    const names = new Set(PAIRS.flatMap(([fg, bg]) => [fg, bg]));
    for (const name of names) expect(tokens.has(name), `--${name} missing`).toBe(true);
  });

  it.each(['light', 'dark'] as const)('meets contrast minimums in the %s theme', (theme) => {
    const failures = PAIRS.flatMap(([fg, bg, min]) => {
      const fgValue = tokens.get(fg)?.[theme];
      const bgValue = tokens.get(bg)?.[theme];
      if (!fgValue || !bgValue) return [`${fg} on ${bg}: undefined`];
      const ratio = contrast(fgValue, bgValue);
      return ratio >= min ? [] : [`${fg} on ${bg}: ${ratio.toFixed(2)} < ${min}`];
    });
    expect(failures).toEqual([]);
  });

  it('removes the default palette so components can only use semantic colors', () => {
    expect(css).toMatch(/--color-\*:\s*initial/);
  });
});
