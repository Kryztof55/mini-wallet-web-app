import { parseMaskedIdentifier } from '@/core/identifier';
import { t } from '@/shared/lib/i18n/t';

/** Words a screen reader can say for a mask; falls back to the mask itself. */
export function spokenMaskedIdentifier(masked: string): string {
  const parts = parseMaskedIdentifier(masked);
  if (parts === null) return masked;
  return parts.kind === 'phone'
    ? t('identifier.spoken.phone', { last4: parts.last4 })
    : t('identifier.spoken.email', { first: parts.first, domain: parts.domain });
}

/** Shows "•••• 5678" but reads "celular terminación 5678" (FS-03 §13, A11Y-17). */
export function MaskedIdentifierText({
  masked,
  className,
}: {
  readonly masked: string;
  readonly className?: string;
}) {
  return (
    <span className={className}>
      <span aria-hidden="true">{masked}</span>
      <span className="sr-only">{spokenMaskedIdentifier(masked)}</span>
    </span>
  );
}
