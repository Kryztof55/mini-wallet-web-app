import { cn } from '@/lib/cn';
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
      <div aria-hidden="true" className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-sm font-semibold text-text-secondary">
          {item.initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-text-primary" title={item.name}>
            {item.name}
          </span>
          <span className="flex min-w-0 gap-1 text-sm text-text-secondary">
            {item.concept ? (
              <>
                <span className="truncate">{item.concept}</span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            <span className="shrink-0">{item.dateLabel}</span>
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span
            className={cn(
              'tabular-nums-amount font-semibold',
              item.direction === 'in' ? 'text-amount-in' : 'text-amount-out',
            )}
          >
            {item.amountText}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            {item.statusLabel ? (
              <span className="rounded-full border border-border-strong px-1.5 py-px font-medium text-text-primary">
                {item.statusLabel}
              </span>
            ) : null}
            {item.directionLabel}
          </span>
        </div>
      </div>
    </li>
  );
}
