import type { Metadata } from 'next';
import { TransferConfirmation } from '@/features/transfer/components/transfer-confirmation';
import { t } from '@/shared/lib/i18n/t';

export const metadata: Metadata = { title: `${t('tx.step.summary')} · ${t('tx.title')}` };

export default function TransferSummaryPage() {
  return <TransferConfirmation />;
}
