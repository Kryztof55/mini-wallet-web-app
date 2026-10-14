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
