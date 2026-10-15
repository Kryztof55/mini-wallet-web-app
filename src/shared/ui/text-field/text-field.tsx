import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/shared/lib/cn';
import { AlertIcon } from '@/shared/ui/icons';

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'aria-describedby' | 'aria-invalid' | 'size' | 'children'
> & {
  /** Visible, persistent label; placeholders are never labels (A11Y-05). */
  readonly label: string;
  readonly hint?: ReactNode;
  /** Error text; when present the input is exposed as invalid (A11Y-07). */
  readonly error?: string | null;
  /** Extra descriptions linked to the input (e.g. available balance). */
  readonly describedBy?: string;
  /** Decorative content inside the box before the value, e.g. "$". */
  readonly startAdornment?: ReactNode;
  readonly ref?: Ref<HTMLInputElement>;
};

/**
 * Text field contract (accessibility requirements §3): label, hint and error linked to the
 * input, invalid state exposed, purpose declared by the caller (`autoComplete`, `inputMode`),
 * paste never blocked.
 */
export function TextField({
  label,
  hint,
  error,
  describedBy,
  startAdornment,
  id,
  className,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const descriptions = [error ? errorId : null, hint ? hintId : null, describedBy ?? null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div
        className={cn(
          'flex min-h-11 items-center gap-2 rounded-md border bg-surface-raised px-3',
          'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring',
          error ? 'border-status-error' : 'border-border-strong',
        )}
      >
        {startAdornment ? (
          <span aria-hidden="true" className="text-text-secondary">
            {startAdornment}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptions || undefined}
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-text-primary outline-none placeholder:text-text-secondary"
          {...inputProps}
        />
      </div>
      {hint ? (
        <p id={hintId} className="text-sm text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-status-error">
          <AlertIcon className="mt-0.5 size-4" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
