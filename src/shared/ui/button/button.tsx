'use client';

import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { cn } from '@/shared/lib/cn';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-classes';
import { Spinner } from '@/shared/ui/icons';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly fullWidth?: boolean;
  /**
   * A request is in progress: the button stays focusable, is exposed as busy and disabled,
   * and ignores clicks (no double submit). It replaces its label with `busyLabel`.
   */
  readonly busy?: boolean;
  readonly busyLabel?: ReactNode;
  readonly ref?: Ref<HTMLButtonElement>;
};

/**
 * There is deliberately no `disabled` prop: primary actions stay enabled with invalid input
 * and show the errors when pressed (UIR-AUTH-03, UIR-TX-13). The only non-interactive state
 * is `busy`.
 */
export function Button({
  variant,
  size,
  fullWidth,
  busy = false,
  busyLabel,
  type = 'button',
  className,
  onClick,
  onMouseDown,
  children,
  ...rest
}: ButtonProps) {
  // A submit button doesn't take focus on mouse down. Otherwise the field being left shows its
  // blur error first, the layout shifts, and the release lands off the button: no submit. The
  // submit handler validates everything and moves focus to the first invalid field anyway.
  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    if (type === 'submit') event.preventDefault();
    onMouseDown?.(event);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      {...rest}
    >
      {busy ? (
        <>
          <Spinner />
          <span>{busyLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
