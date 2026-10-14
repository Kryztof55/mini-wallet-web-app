import type { Money } from '@/core/money';
import type { TransactionDirection, TransactionStatus } from '@/core/transaction';
import { formatFullDateTime, formatRelativeDate } from '@/lib/format/date';
import { formatSignedAmount } from '@/lib/format/money';
import { initialsOf } from '@/lib/format/initials';
import { t } from '@/lib/i18n/t';

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
  // EC-03: no name → the masked identifier stands in.
  const name = item.counterparty.name?.trim() || item.counterparty.maskedIdentifier;
  const directionLabel = t(`tx.direction.${item.direction}`);
  const amountText = formatSignedAmount(item.amount, item.direction);
  const statusLabel = item.status === 'completed' ? null : t(`tx.status.${item.status}`);
  const parts = [
    t(item.direction === 'out' ? 'tx.item.to' : 'tx.item.from', {
      direction: directionLabel,
      name,
    }),
    amountText,
    formatFullDateTime(item.occurredAt, timeZone),
    ...(item.concept ? [t('tx.item.concept', { concept: item.concept })] : []),
    ...(statusLabel ? [t('tx.item.status', { status: statusLabel })] : []),
  ];
  return {
    id: item.id,
    direction: item.direction,
    name,
    initials: item.counterparty.name ? initialsOf(item.counterparty.name) : '#',
    concept: item.concept,
    amountText,
    directionLabel,
    dateLabel: formatRelativeDate(item.occurredAt, now, timeZone),
    statusLabel,
    accessibleText: parts.join(', '),
  };
}
