import type { Metadata } from 'next';
import { RecipientStep } from '@/features/transfer/recipient-step';
import { t } from '@/lib/i18n/t';

export const metadata: Metadata = { title: `${t('tx.step.recipient')} · ${t('tx.title')}` };

export default function TransferRecipientPage() {
  return <RecipientStep />;
}
