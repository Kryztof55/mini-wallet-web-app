import { describe, expect, it } from 'vitest';
import {
  cleanAmountText,
  formatAmountText,
  moneyToAmountText,
  parseAmountInput,
} from './money-input';

describe('[TC-UNIT-02][BR-04][UIR-TX-10] amount input parsing and formatting', () => {
  it.each([
    ['250', 25000],
    ['0.01', 1],
    ['007', 700], // FS-03 EC-03
    ['25.', 2500], // FS-03 EC-03
    ['.5', 50],
    ['$1,250.50', 125050], // FS-03 EC-04
    [' 1 000.5 ', 100050],
    ['0', 0],
  ])('parses %j as %d minor units', (raw, minor) => {
    expect(parseAmountInput(raw)).toEqual({
      ok: true,
      value: { amountMinor: minor, currency: 'MXN' },
    });
  });

  it.each([
    ['12.345', 'too_many_decimals'],
    ['abc', 'not_a_number'],
    ['12a', 'not_a_number'],
    ['1.2.3', 'not_a_number'],
    ['', 'not_a_number'],
    ['.', 'not_a_number'],
    ['-5', 'not_a_number'],
  ])('rejects %j (%s)', (raw, reason) => {
    expect(parseAmountInput(raw)).toEqual({
      ok: false,
      error: { code: 'INVALID_AMOUNT', details: { reason } },
    });
  });

  it.each([
    ['12.345', '12.34'],
    ['1a2b3', '123'],
    ['$1,250.50', '1250.50'],
    ['1..2', '1.2'],
    ['', ''],
  ])('cleans typed text %j to %j', (raw, clean) => {
    expect(cleanAmountText(raw)).toBe(clean);
  });

  it.each([
    ['1250.5', '1,250.5'],
    ['1000000', '1,000,000'],
    ['007', '7'],
    ['25.', '25.'],
    ['0.5', '0.5'],
  ])('formats %j as %j while typing', (clean, formatted) => {
    expect(formatAmountText(clean)).toBe(formatted);
  });

  it('turns Money back into editable text', () => {
    expect(moneyToAmountText({ amountMinor: 125005, currency: 'MXN' })).toBe('1250.05');
  });
});
