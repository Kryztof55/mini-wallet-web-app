import type { Metadata } from 'next';
import { RecipientStep } from '@/features/transfer/components/recipient-step';
import { t } from '@/shared/lib/i18n/t';

export const metadata: Metadata = { title: `${t('tx.step.recipient')} · ${t('tx.title')}` };

export default function TransferRecipientPage() {
  return <RecipientStep />;
}
