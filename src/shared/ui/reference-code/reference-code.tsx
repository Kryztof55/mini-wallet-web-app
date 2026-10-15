import { toReferenceCode } from '@/shared/lib/observability/request-id';
import { messages } from '@/shared/lib/i18n/messages.es-MX';
import { cn } from '@/shared/lib/cn';

const [BEFORE = '', AFTER = ''] = messages['common.reference'].split('{code}');

/**
 * Short correlation code shown on every error or unresolved state (UIR-CONF-11, TS-05 §11.4).
 * Monospaced and selectable so users can read it out or copy it for support.
 */
export function ReferenceCode({
  requestId,
  className,
}: {
  readonly requestId: string;
  readonly className?: string;
}) {
  return (
    <p className={cn('text-sm text-text-secondary', className)}>
      {BEFORE}
      <code className="font-mono font-medium text-text-primary select-all">
        {toReferenceCode(requestId)}
      </code>
      {AFTER}
    </p>
  );
}
