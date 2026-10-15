import type { Money } from '@/core/money';

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

export type Direction = 'in' | 'out';

/** `+$1,000.00` (incoming) / `−$250.00` (outgoing, true minus sign) — UIR-HOME-07. */
export function formatSignedAmount(money: Money, direction: Direction): string {
  return `${direction === 'in' ? '+' : '−'}${formatMoney(money)}`;
}

/** Visual placeholder for a hidden balance (UIR-HOME-05). */
export const HIDDEN_AMOUNT = '$ ••••••';
