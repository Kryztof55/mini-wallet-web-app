import { cn } from '@/shared/lib/cn';
import type { ActivityItemView } from '@/features/home/activity-view';

/**
 * One activity row (UIR-HOME-06…09): read as one sentence by assistive technology; the
 * visual parts are hidden from it. Direction is shown by sign and label, colour only helps.
 */
export function TransactionItem({
  item,
  highlighted = false,
}: {
  readonly item: ActivityItemView;
  readonly highlighted?: boolean;
}) {
  return (
    <li
      className={cn(
        'rounded-md px-2 py-3',
        highlighted &&
          'bg-status-success-surface motion-safe:transition-colors motion-safe:duration-1000',
      )}
    >
      <span className="sr-only">{item.accessibleText}</span>
      {/*
       * Narrow widths and large text (A11Y-12, TASK-21): the right column only holds the amount
       * and direction; when the name column would get narrower than 7rem, the amount drops to
       * its own line instead of squeezing the name. The secondary line wraps (concept → date →
       * status) rather than overlapping. Name and concept truncate (UIR-HOME-09) with the full
       * text in `title` and in the sentence above.
       */}
      <div aria-hidden="true" className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-sm font-semibold text-text-secondary">
          {item.initials}
        </span>
        <div className="flex min-w-0 flex-1 basis-28 flex-col">
          <span className="truncate font-medium text-text-primary" title={item.name}>
            {item.name}
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-text-secondary">
            {item.concept ? (
              <span className="max-w-full truncate" title={item.concept}>
                {item.concept}
              </span>
            ) : null}
            <span className="whitespace-nowrap">
              {item.concept ? <span className="me-1.5">·</span> : null}
              {item.dateLabel}
            </span>
            {item.statusLabel ? (
              <span className="rounded-full border border-border-strong px-1.5 py-px text-xs font-medium whitespace-nowrap text-text-primary">
                {item.statusLabel}
              </span>
            ) : null}
          </span>
        </div>
        <div className="ms-auto flex shrink-0 flex-col items-end gap-0.5">
          <span
            className={cn(
              'tabular-nums-amount font-semibold whitespace-nowrap',
              item.direction === 'in' ? 'text-amount-in' : 'text-amount-out',
            )}
          >
            {item.amountText}
          </span>
          <span className="text-xs text-text-secondary">{item.directionLabel}</span>
        </div>
      </div>
    </li>
  );
}
