import type { Metadata } from 'next';
import { SummaryStep } from '@/features/transfer/summary-step';
import { t } from '@/lib/i18n/t';

export const metadata: Metadata = { title: `${t('tx.step.summary')} · ${t('tx.title')}` };

export default function TransferSummaryPage() {
  return <SummaryStep />;
}
