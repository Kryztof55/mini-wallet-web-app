import type { Money } from '@/core/money';
import { t } from '@/shared/lib/i18n/t';

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: Money['currency']): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

/** `$12,345.67` — symbol, es-MX grouping, always two decimals (UX-16). */
export function formatMoney(money: Money): string {
  return currencyFormatter(money.currency).format(money.amountMinor / 100);
}

/**
 * What a screen reader says for an amount: "12345 pesos con 67 centavos", "250 pesos",
 * "1 peso" (A11Y-17, FS-02 §13). "$" alone may be read as "dólares" by a non-Mexican voice,
 * and "12,345" as a decimal by a Spain voice, so: words for the currency, no grouping.
 */
export function spokenMoney(money: Money): string {
  const pesos = Math.trunc(money.amountMinor / 100);
  const cents = money.amountMinor % 100;
  const whole = t(pesos === 1 ? 'money.spoken.pesos_one' : 'money.spoken.pesos', { n: pesos });
  if (cents === 0) return whole;
  return t(cents === 1 ? 'money.spoken.cents_one' : 'money.spoken.cents', {
    pesos: whole,
    n: cents,
  });
}

export type Direction = 'in' | 'out';

/** `+$1,000.00` (incoming) / `−$250.00` (outgoing, true minus sign) — UIR-HOME-07. */
export function formatSignedAmount(money: Money, direction: Direction): string {
  return `${direction === 'in' ? '+' : '−'}${formatMoney(money)}`;
}

/** Visual placeholder for a hidden balance (UIR-HOME-05). */
export const HIDDEN_AMOUNT = '$ ••••••';
