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

export type AmountEdit = {
  /** Cleaned text without grouping, e.g. `1250.5`. */
  readonly text: string;
  /** What the field shows, e.g. `1,250.5`. */
  readonly display: string;
  /** Where the caret goes in `display`. */
  readonly caret: number;
};

/**
 * UIR-TX-10: cleans and groups what is in the field after an edit and keeps the caret after
 * the same digit it followed, so grouping commas never make it jump (TS-03 §13).
 * Works because `cleanAmountText` is left-to-right: cleaning a prefix gives a prefix.
 */
export function editAmountText(raw: string, caret: number): AmountEdit {
  const clean = cleanAmountText(raw);
  const display = formatAmountText(clean);
  const text = display.replace(/,/g, '');
  const keptBefore = cleanAmountText(raw.slice(0, Math.max(0, caret))).length;
  const zerosDropped = clean.length - text.length;
  const target = keptBefore - Math.min(zerosDropped, keptBefore);
  let seen = 0;
  let position = 0;
  while (position < display.length && seen < target) {
    if (display[position] !== ',') seen += 1;
    position += 1;
  }
  return { text, display, caret: position };
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
