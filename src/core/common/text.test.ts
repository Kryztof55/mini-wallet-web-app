import { describe, expect, it } from 'vitest';
import { countCharacters, stripControlCharacters, truncateCharacters } from './text';

describe('[TC-UNIT-10][BR-15] concept input helpers', () => {
  it('keeps the first N characters, counting an emoji as one', () => {
    expect(truncateCharacters('a'.repeat(45), 40)).toBe('a'.repeat(40));
    const withEmoji = `${'a'.repeat(39)}👩‍👩‍👧b`;
    expect(truncateCharacters(withEmoji, 40)).toBe(`${'a'.repeat(39)}👩‍👩‍👧`);
    expect(countCharacters(truncateCharacters(withEmoji, 40))).toBe(40);
    expect(truncateCharacters('Tacos', 40)).toBe('Tacos');
  });

  it('drops line breaks and control characters', () => {
    expect(stripControlCharacters('Tacos\nal\tpastor\u0007')).toBe('Tacosalpastor');
    expect(stripControlCharacters('Ñandú 🌮')).toBe('Ñandú 🌮');
  });
});
