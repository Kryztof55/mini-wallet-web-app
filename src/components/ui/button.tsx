'use client';

import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './icons';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-action-primary text-action-primary-text hover:bg-action-primary-hover',
  secondary: 'bg-action-secondary text-action-secondary-text hover:bg-action-secondary-hover',
  ghost: 'bg-transparent text-text-link hover:bg-action-secondary',
};

const SIZES: Record<ButtonSize, string> = {
  // 44 px: primary and frequent actions (A11Y-13).
  md: 'min-h-11 px-5 text-base',
  sm: 'min-h-9 px-3 text-sm',
};

/** Shared with link-styled buttons so both look and size the same. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean } = {}): string {
  return cn(
    // The transparent border becomes visible in forced-colors mode, so the button keeps a shape.
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent font-semibold no-underline transition-colors select-none',
    'aria-busy:cursor-progress',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
  );
}

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
  children,
  ...rest
}: ButtonProps) {
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
