import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { InboxIcon } from './icons';

export function EmptyState({
  title,
  description,
  action,
  headingLevel = 2,
  className,
}: {
  readonly title: string;
  readonly description?: ReactNode;
  /** An empty screen is an invitation to act. */
  readonly action?: ReactNode;
  readonly headingLevel?: 2 | 3;
  readonly className?: string;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className={cn('flex flex-col items-center gap-2 px-4 py-8 text-center', className)}>
      <InboxIcon className="size-8 text-text-secondary" />
      <Heading className="text-base font-semibold text-text-primary">{title}</Heading>
      {description ? (
        <p className="max-w-prose text-sm text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
