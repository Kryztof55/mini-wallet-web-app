import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { AlertIcon, CheckIcon } from '@/shared/ui/icons';

const TONES = {
  info: { box: 'bg-status-info-surface', icon: 'text-status-info', Icon: AlertIcon },
  success: { box: 'bg-status-success-surface', icon: 'text-status-success', Icon: CheckIcon },
  warning: { box: 'bg-status-warning-surface', icon: 'text-status-warning', Icon: AlertIcon },
} as const;

/** Inline, non-blocking message with icon + text (A11Y-11). Announce it with `useAnnounce`. */
export function Notice({
  tone = 'info',
  className,
  children,
}: {
  readonly tone?: keyof typeof TONES;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const { box, icon, Icon } = TONES[tone];
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border border-border p-3 text-sm text-text-primary',
        box,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 size-4', icon)} />
      <div>{children}</div>
    </div>
  );
}
