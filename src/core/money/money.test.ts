import { describe, expect, it } from 'vitest';
import { Money } from './money';

const mxn = (amountMinor: number): Money => ({ amountMinor, currency: 'MXN' });

describe('[TC-UNIT-01][BR-04] Money value object', () => {
  it.each([0, 1, 25000, Number.MAX_SAFE_INTEGER])('accepts %d minor units', (minor) => {
    expect(Money.fromMinor(minor)).toEqual({ ok: true, value: mxn(minor) });
  });

  it.each([-1, 0.5, 12.34, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects %d (negative, fractional or unsafe)',
    (minor) => {
      const result = Money.fromMinor(minor);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('INVALID_AMOUNT');
    },
  );

  it('adds and subtracts exactly, without floating point drift', () => {
    expect(Money.add(mxn(10), mxn(20))).toEqual(mxn(30));
    expect(Money.subtract(mxn(100000), mxn(25050))).toEqual({ ok: true, value: mxn(74950) });
  });

  it('never produces a negative amount', () => {
    expect(Money.subtract(mxn(100), mxn(101)).ok).toBe(false);
  });

  it('compares, detects zero and checks equality', () => {
    expect(Money.compare(mxn(1), mxn(2))).toBe(-1);
    expect(Money.compare(mxn(2), mxn(2))).toBe(0);
    expect(Money.compare(mxn(3), mxn(2))).toBe(1);
    expect(Money.isZero(Money.zero())).toBe(true);
    expect(Money.equals(mxn(5), mxn(5))).toBe(true);
  });
});
