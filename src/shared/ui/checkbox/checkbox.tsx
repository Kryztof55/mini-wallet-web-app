import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/shared/lib/cn';

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'aria-describedby' | 'children'
> & {
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly ref?: Ref<HTMLInputElement>;
};

/** Native checkbox: keyboard, forms and assistive tech work without extra code. */
export function Checkbox({ label, hint, id, className, ...inputProps }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        type="checkbox"
        id={inputId}
        aria-describedby={hint ? hintId : undefined}
        className="size-6 shrink-0 cursor-pointer accent-action-primary"
        {...inputProps}
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={inputId} className="cursor-pointer text-base text-text-primary">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="text-sm text-text-secondary">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
