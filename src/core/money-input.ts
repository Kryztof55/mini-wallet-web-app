import { domainError, type DomainError } from './errors';
import { Money } from './money';
import { err, type Result } from './result';

/** Maximum decimals accepted for MXN (BR-04). */
export const AMOUNT_DECIMALS = 2;

/**
 * Keeps only what an amount field may contain while the user types (UIR-TX-10):
 * digits and a single decimal point, with at most two decimals. Grouping commas,
 * currency symbols, spaces and letters are dropped.
 */
export function cleanAmountText(raw: string): string {
  let result = '';
  let seenPoint = false;
  let decimals = 0;
  for (const char of raw) {
    if (char >= '0' && char <= '9') {
      if (seenPoint) {
        if (decimals >= AMOUNT_DECIMALS) continue;
        decimals += 1;
      }
      result += char;
    } else if (char === '.' && !seenPoint) {
      seenPoint = true;
      result += char;
    }
  }
  return result;
}

/** Adds es-MX thousands separators to a cleaned amount text: `1250.5` → `1,250.5`. */
export function formatAmountText(clean: string): string {
  const [integerPart = '', decimalPart] = clean.split('.');
  const trimmed = integerPart.replace(/^0+(?=\d)/, '');
  const grouped = trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart === undefined ? grouped : `${grouped}.${decimalPart}`;
}

const AMOUNT_PATTERN = /^(\d*)(?:\.(\d*))?$/;

/**
 * Parses what the user typed or pasted into Money (BR-04). Accepts `$`, spaces and grouping
 * commas; rejects letters, more than one point and more than two decimals.
 * Zero is a valid parse: BR-01 is checked separately by `validateAmount`.
 */
export function parseAmountInput(raw: string): Result<Money, DomainError<'INVALID_AMOUNT'>> {
  const normalized = raw.trim().replace(/^\$/, '').replace(/[\s,]/g, '');
  const match = AMOUNT_PATTERN.exec(normalized);
  const integerDigits = match?.[1] ?? '';
  const decimalDigits = match?.[2] ?? '';

  if (!match || (integerDigits === '' && decimalDigits === '')) {
    return err(domainError('INVALID_AMOUNT', { reason: 'not_a_number' }));
  }
  if (decimalDigits.length > AMOUNT_DECIMALS) {
    return err(domainError('INVALID_AMOUNT', { reason: 'too_many_decimals' }));
  }

  const cents = decimalDigits.padEnd(AMOUNT_DECIMALS, '0');
  const minor = Number(`${integerDigits === '' ? '0' : integerDigits}${cents}`);
  return Money.fromMinor(minor);
}

/** Money → plain editable text (`1250.5` style, no grouping), for pre-filling inputs. */
export function moneyToAmountText(money: Money): string {
  const units = Math.trunc(money.amountMinor / 100);
  const cents = (money.amountMinor % 100).toString().padStart(AMOUNT_DECIMALS, '0');
  return `${units}.${cents}`;
}
