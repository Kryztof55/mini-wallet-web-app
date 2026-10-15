import { t } from '@/shared/lib/i18n/t';
import { Avatar } from '@/features/transfer/components/avatar';
import { spokenMaskedIdentifier } from '@/shared/components/masked-identifier';

/**
 * A favorite is an action, not a selection (UIR-TX-04): one press chooses it and moves on.
 * Accessible name: "Enviar a Ana López, celular terminación 5678" (FS-03 §13); it contains the
 * visible name and digits (label in name).
 */
export function ContactItem({
  name,
  maskedIdentifier,
  onSelect,
}: {
  readonly name: string;
  readonly maskedIdentifier: string;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${t('tx.recipient.send_to', { name })}, ${spokenMaskedIdentifier(maskedIdentifier)}`}
      className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-sunken"
    >
      <Avatar name={name} />
      <span className="flex min-w-0 flex-col">
        {/* Wraps rather than truncating: large text must not hide who you pay (A11Y-12). */}
        <span className="font-medium [overflow-wrap:anywhere] text-text-primary">{name}</span>
        <span className="text-sm [overflow-wrap:anywhere] text-text-secondary">
          {maskedIdentifier}
        </span>
      </span>
    </button>
  );
}
