import Link from 'next/link';
import { t } from '@/lib/i18n/t';
import { Avatar } from './avatar';
import { MaskedIdentifierText } from './masked-identifier';

/** UIR-TX-09: who the money goes to, on the amount and summary steps, with "Cambiar". */
export function RecipientContext({
  name,
  maskedIdentifier,
}: {
  readonly name: string;
  readonly maskedIdentifier: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3">
      <Avatar name={name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{name}</span>
        <MaskedIdentifierText masked={maskedIdentifier} className="text-sm text-text-secondary" />
      </div>
      <Link
        href="/transfer/recipient"
        aria-label={t('tx.change_recipient_aria')}
        className="rounded-md px-2 py-1 text-sm font-medium text-text-link hover:bg-action-secondary"
      >
        {t('tx.change')}
      </Link>
    </div>
  );
}
