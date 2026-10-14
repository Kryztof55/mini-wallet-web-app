import { describe, expect, it } from 'vitest';
import { formatFullDateTime, formatRelativeDate } from './date';
import { formatMoney, formatSignedAmount } from './money';

const mxn = (amountMinor: number) => ({ amountMinor, currency: 'MXN' as const });

describe('[TC-UNIT-17][UIR-HOME-07][UIR-HOME-08][NFR-13] formatters', () => {
  it('formats money in es-MX with symbol, grouping and two decimals', () => {
    expect(formatMoney(mxn(1234567))).toBe('$12,345.67');
    expect(formatMoney(mxn(0))).toBe('$0.00');
    expect(formatMoney(mxn(999999999))).toBe('$9,999,999.99');
  });

  it('formats signed amounts with direction (true minus sign for outgoing)', () => {
    expect(formatSignedAmount(mxn(25000), 'out')).toBe('−$250.00');
    expect(formatSignedAmount(mxn(100000), 'in')).toBe('+$1,000.00');
  });

  describe('relative dates in the user time zone (FS-02 EC-09)', () => {
    // 2026-10-14 12:00 in Mexico City (UTC-6)
    const now = new Date('2026-10-14T18:00:00Z');
    const tz = 'America/Mexico_City';

    it('today', () => {
      expect(formatRelativeDate('2026-10-14T20:32:00Z', now, tz)).toBe('Hoy, 14:32');
    });

    it('yesterday', () => {
      expect(formatRelativeDate('2026-10-13T15:10:00Z', now, tz)).toBe('Ayer, 09:10');
    });

    it('earlier this year', () => {
      expect(formatRelativeDate('2026-10-12T00:05:00Z', now, tz)).toBe('11 oct, 18:05');
    });

    it('another year shows the year', () => {
      expect(formatRelativeDate('2025-10-13T00:05:00Z', now, tz)).toBe('12 oct 2025, 18:05');
    });

    it('uses the time zone, not UTC, to decide the day', () => {
      // 2026-10-14 03:00 UTC is still Oct 13 in Mexico City → "Ayer"
      expect(formatRelativeDate('2026-10-14T03:00:00Z', now, tz)).toBe('Ayer, 21:00');
    });
  });

  it('formats a long, unambiguous date for receipts and screen readers', () => {
    expect(formatFullDateTime('2026-10-13T20:32:00Z', 'America/Mexico_City')).toBe(
      '13 de octubre de 2026, 14:32',
    );
  });
});
