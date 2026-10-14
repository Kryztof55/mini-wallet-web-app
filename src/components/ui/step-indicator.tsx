import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n/t';

/**
 * "Paso 2 de 3 — Monto" (UIR-TX-01). The text carries the meaning; the bar is decorative.
 * Announced on step change through the step heading receiving focus (UIR-TX-02).
 */
export function StepIndicator({
  current,
  total,
  name,
  className,
}: {
  /** 1-based. */
  readonly current: number;
  readonly total: number;
  readonly name: string;
  readonly className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-sm font-medium text-text-secondary">
        {t('common.step', { n: current, total, name })}
      </p>
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full',
              index < current ? 'bg-action-primary' : 'bg-border',
            )}
          />
        ))}
      </div>
    </div>
  );
}
