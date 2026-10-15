import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/** NFR-16: components never reference raw colors; they use semantic token utilities. */
const ROOT = join(process.cwd(), 'src');
/** Metadata that browsers read outside CSS (theme-color) cannot use CSS variables. */
const ALLOWED = new Set(['app/layout.tsx']);
const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(|\[(?:#|rgb|hsl)/i;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [path] : [];
  });
}

describe('[NFR-16] no raw colors in components', () => {
  it('uses only semantic tokens', () => {
    const offenders = sourceFiles(ROOT)
      .map((path) => relative(ROOT, path))
      .filter((path) => !ALLOWED.has(path))
      .filter((path) => RAW_COLOR.test(readFileSync(join(ROOT, path), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
