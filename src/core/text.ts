const segmenter = new Intl.Segmenter('es-MX', { granularity: 'grapheme' });

/** Counts user-perceived characters (graphemes), not bytes or UTF-16 units (FS-03 EC-07). */
export function countCharacters(value: string): number {
  let count = 0;
  for (const _ of segmenter.segment(value)) count += 1;
  return count;
}

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/;

export function hasControlCharacters(value: string): boolean {
  return CONTROL_CHARACTERS.test(value);
}

/** Keeps the first `max` characters (graphemes), so an emoji is never cut in half (BR-15). */
export function truncateCharacters(value: string, max: number): string {
  let result = '';
  let count = 0;
  for (const { segment } of segmenter.segment(value)) {
    if (count === max) break;
    result += segment;
    count += 1;
  }
  return result;
}

const CONTROL_CHARACTERS_GLOBAL = /[\u0000-\u001F\u007F-\u009F]/g;

/** Drops line breaks and other control characters (BR-15). */
export function stripControlCharacters(value: string): string {
  return value.replace(CONTROL_CHARACTERS_GLOBAL, '');
}
