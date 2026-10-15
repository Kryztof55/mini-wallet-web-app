import Link from 'next/link';
import { t } from '@/shared/lib/i18n/t';
import { Avatar } from '@/features/transfer/components/avatar';
import { MaskedIdentifierText } from '@/shared/components/masked-identifier';

/** UIR-TX-09: who the money goes to, on the amount and summary steps, with "Cambiar". */
export function RecipientContext({
  name,
  maskedIdentifier,
}: {
  readonly name: string;
  readonly maskedIdentifier: string;
}) {
  return (
    // When the name would get narrower than 6rem (large text), "Cambiar" drops to its own line.
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-raised p-3">
      <Avatar name={name} />
      <div className="flex min-w-0 flex-1 basis-24 flex-col">
        <span className="font-medium [overflow-wrap:anywhere]">{name}</span>
        <MaskedIdentifierText
          masked={maskedIdentifier}
          className="text-sm [overflow-wrap:anywhere] text-text-secondary"
        />
      </div>
      <Link
        href="/transfer/recipient"
        aria-label={t('tx.change_recipient_aria')}
        className="ms-auto inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium text-text-link hover:bg-action-secondary"
      >
        {t('tx.change')}
      </Link>
    </div>
  );
}
