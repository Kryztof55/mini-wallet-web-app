import type { Metadata } from 'next';
import { AmountStep } from '@/features/transfer/amount-step';
import { t } from '@/lib/i18n/t';

export const metadata: Metadata = { title: `${t('tx.step.amount')} · ${t('tx.title')}` };

export default function TransferAmountPage() {
  return <AmountStep />;
}
