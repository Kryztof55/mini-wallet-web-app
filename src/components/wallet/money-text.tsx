import type { Money } from '@/core/money';
import { cn } from '@/lib/cn';
import { formatMoney, HIDDEN_AMOUNT } from '@/lib/format/money';
import { t } from '@/lib/i18n/t';

/** `$12,345.67` with tabular digits; masked as `$ ••••••`, announced "Saldo oculto". */
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
  return <span className={cn('tabular-nums-amount', className)}>{formatMoney(value)}</span>;
}
