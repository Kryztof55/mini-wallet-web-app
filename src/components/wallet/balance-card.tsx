'use client';

import { Money } from '@/core/money';
import { useHideBalance } from '@/features/home/hide-balance';
import { t } from '@/lib/i18n/t';
import { HideBalanceToggle } from './hide-balance-toggle';
import { MoneyText } from './money-text';

/**
 * Balance (FS-02): big tabular figure, hide/show toggle with its pressed state (UIR-HOME-05),
 * zero-balance note (UIR-HOME-04). The section heading lives outside, so it is stable across
 * loading, error and ready states.
 */
export function BalanceCard({ balance }: { readonly balance: Money }) {
  const { hidden } = useHideBalance();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <MoneyText
          value={balance}
          hidden={hidden}
          className="text-4xl font-bold tracking-tight break-all sm:text-5xl"
        />
        <HideBalanceToggle />
      </div>
      {Money.isZero(balance) ? (
        <p className="text-sm text-text-secondary">{t('home.balance.zero')}</p>
      ) : null}
    </div>
  );
}
