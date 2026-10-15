import { cn } from '@/shared/lib/cn';
import { initialsOf } from '@/shared/lib/format/initials';

/** Initials avatar; decorative, the name is always next to it (A11Y-18). */
export function Avatar({
  name,
  className,
}: {
  readonly name: string;
  readonly className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-sm font-semibold text-text-secondary',
        className,
      )}
    >
      {initialsOf(name) || '#'}
    </span>
  );
}
