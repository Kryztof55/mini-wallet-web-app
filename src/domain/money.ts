import { domainError, type DomainError } from './errors';
import { err, ok, type Result } from './result';

export type Currency = 'MXN';

/**
 * Money as an integer number of minor units (cents). Never floating point (BR-04).
 * Invariant: `amountMinor` is a safe, non-negative integer.
 */
export type Money = { readonly amountMinor: number; readonly currency: Currency };

type MoneyError = DomainError<'INVALID_AMOUNT'>;

function isValidMinor(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export const Money = {
  fromMinor(amountMinor: number, currency: Currency = 'MXN'): Result<Money, MoneyError> {
    if (!isValidMinor(amountMinor)) {
      return err(domainError('INVALID_AMOUNT', { reason: 'not_a_non_negative_integer' }));
    }
    return ok({ amountMinor, currency });
  },

  zero(currency: Currency = 'MXN'): Money {
    return { amountMinor: 0, currency };
  },

  isZero(money: Money): boolean {
    return money.amountMinor === 0;
  },

  add(a: Money, b: Money): Money {
    return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
  },

  /** `a - b`; fails instead of producing a negative amount. */
  subtract(a: Money, b: Money): Result<Money, MoneyError> {
    const amountMinor = a.amountMinor - b.amountMinor;
    if (amountMinor < 0) return err(domainError('INVALID_AMOUNT', { reason: 'negative_result' }));
    return ok({ amountMinor, currency: a.currency });
  },

  compare(a: Money, b: Money): -1 | 0 | 1 {
    if (a.amountMinor === b.amountMinor) return 0;
    return a.amountMinor < b.amountMinor ? -1 : 1;
  },

  equals(a: Money, b: Money): boolean {
    return a.currency === b.currency && a.amountMinor === b.amountMinor;
  },
} as const;
