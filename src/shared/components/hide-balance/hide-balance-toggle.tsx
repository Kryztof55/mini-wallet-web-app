'use client';

import { useHideBalance } from './hide-balance';
import { t } from '@/shared/lib/i18n/t';
import { EyeIcon, EyeOffIcon } from '@/shared/ui/icons';

/** "Ocultar saldo" toggle with its pressed state (UIR-HOME-05); shared by Home and the summary. */
export function HideBalanceToggle() {
  const { hidden, toggle } = useHideBalance();
  return (
    <button
      type="button"
      aria-pressed={hidden}
      onClick={toggle}
      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-2 text-sm font-medium text-text-link hover:bg-action-secondary aria-pressed:border-border-strong aria-pressed:bg-action-secondary"
    >
      {hidden ? <EyeIcon /> : <EyeOffIcon />}
      <span>{t('home.balance.hide')}</span>
    </button>
  );
}
