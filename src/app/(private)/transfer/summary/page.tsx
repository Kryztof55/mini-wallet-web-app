import type { Metadata } from 'next';
import { TransferConfirmation } from '@/features/confirmation/transfer-confirmation';
import { t } from '@/lib/i18n/t';

export const metadata: Metadata = { title: `${t('tx.step.summary')} · ${t('tx.title')}` };

export default function TransferSummaryPage() {
  return <TransferConfirmation />;
}
