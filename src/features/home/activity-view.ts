import type { Money } from '@/core/money';
import type { TransactionDirection, TransactionStatus } from '@/core/transfers';
import { formatFullDateTime, formatRelativeDate } from '@/shared/lib/format/date';
import { formatSignedAmount, spokenMoney } from '@/shared/lib/format/money';
import { initialsOf } from '@/shared/lib/format/initials';
import { t } from '@/shared/lib/i18n/t';
import { spokenMaskedIdentifier } from '@/shared/components/masked-identifier';

/** What the API returns for an activity item (TS-02 §4). */
export type ActivityItemData = {
  readonly id: string;
  readonly direction: TransactionDirection;
  readonly counterparty: { readonly name: string | null; readonly maskedIdentifier: string };
  readonly amount: Money;
  readonly concept: string | null;
  readonly status: TransactionStatus;
  readonly occurredAt: string;
};

/**
 * Display-ready item. Built where the data is fetched (server render, or client after a
 * retry), so dates and amounts are formatted once and server/client HTML always match.
 */
export type ActivityItemView = {
  readonly id: string;
  readonly direction: TransactionDirection;
  readonly name: string;
  readonly initials: string;
  readonly concept: string | null;
  readonly amountText: string;
  readonly directionLabel: string;
  readonly dateLabel: string;
  readonly statusLabel: string | null;
  /** One coherent sentence for assistive technology (A11Y-17). */
  readonly accessibleText: string;
};

export function toActivityItemView(
  item: ActivityItemData,
  now: Date,
  timeZone: string,
): ActivityItemView {
  // EC-03: no name → the masked identifier stands in; it is spoken as words (A11Y-17).
  const realName = item.counterparty.name?.trim() || null;
  const name = realName ?? item.counterparty.maskedIdentifier;
  const spokenName = realName ?? spokenMaskedIdentifier(item.counterparty.maskedIdentifier);
  const directionLabel = t(`tx.direction.${item.direction}`);
  const amountText = formatSignedAmount(item.amount, item.direction);
  const statusLabel = item.status === 'completed' ? null : t(`tx.status.${item.status}`);
  const parts = [
    t(item.direction === 'out' ? 'tx.item.to' : 'tx.item.from', {
      direction: directionLabel,
      name: spokenName,
    }),
    // Direction is already in the words ("Enviado a"); the amount is spoken, not "−$" (A11Y-17).
    spokenMoney(item.amount),
    formatFullDateTime(item.occurredAt, timeZone),
    ...(item.concept ? [t('tx.item.concept', { concept: item.concept })] : []),
    ...(statusLabel ? [t('tx.item.status', { status: statusLabel })] : []),
  ];
  return {
    id: item.id,
    direction: item.direction,
    name,
    initials: realName ? initialsOf(realName) : '#',
    concept: item.concept,
    amountText,
    directionLabel,
    dateLabel: formatRelativeDate(item.occurredAt, now, timeZone),
    statusLabel,
    accessibleText: parts.join(', '),
  };
}
