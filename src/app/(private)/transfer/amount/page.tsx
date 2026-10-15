import type { Metadata } from 'next';
import { AmountStep } from '@/features/transfer/components/amount-step';
import { t } from '@/shared/lib/i18n/t';

export const metadata: Metadata = { title: `${t('tx.step.amount')} · ${t('tx.title')}` };

export default function TransferAmountPage() {
  return <AmountStep />;
}
