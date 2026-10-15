import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n/t';
import { Button } from '@/shared/ui/button';
import { AlertIcon } from '@/shared/ui/icons';
import { ReferenceCode } from '@/shared/ui/reference-code';

export type ErrorStateProps = {
  readonly title: string;
  readonly description?: ReactNode;
  /** Shows a keyboard-reachable retry action (async section pattern). */
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly retrying?: boolean;
  /** Correlation ID of the failed request, shown as a reference code. */
  readonly requestId?: string | null;
  readonly headingLevel?: 2 | 3;
  readonly className?: string;
};

/**
 * Error in a section or view: icon + text (never color alone, A11Y-11), optional retry and
 * reference code. Announce it with `useAnnounce` when it replaces content after a request.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = t('common.retry'),
  retrying = false,
  requestId,
  headingLevel = 2,
  className,
}: ErrorStateProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-border bg-status-error-surface p-4',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertIcon className="mt-0.5 text-status-error" />
        <div className="flex flex-col gap-1">
          <Heading className="text-base font-semibold text-text-primary">{title}</Heading>
          {description ? <p className="text-sm text-text-primary">{description}</p> : null}
        </div>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" busy={retrying} onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
      {requestId ? <ReferenceCode requestId={requestId} /> : null}
    </div>
  );
}
