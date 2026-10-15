import type { Money } from '@/core/money';
import { cn } from '@/shared/lib/cn';
import { formatMoney, HIDDEN_AMOUNT, spokenMoney } from '@/shared/lib/format/money';
import { t } from '@/shared/lib/i18n/t';

/**
 * `$12,345.67` with tabular digits, read as "12345 pesos con 67 centavos" (A11Y-17);
 * masked as `$ ••••••`, announced "Saldo oculto".
 */
export function MoneyText({
  value,
  hidden = false,
  className,
}: {
  readonly value: Money;
  readonly hidden?: boolean;
  readonly className?: string;
}) {
  if (hidden) {
    return (
      <span className={cn('tabular-nums-amount', className)}>
        <span aria-hidden="true">{HIDDEN_AMOUNT}</span>
        <span className="sr-only">{t('home.balance.hidden')}</span>
      </span>
    );
  }
  return (
    <span className={cn('tabular-nums-amount', className)}>
      <span aria-hidden="true">{formatMoney(value)}</span>
      <span className="sr-only">{spokenMoney(value)}</span>
    </span>
  );
}
