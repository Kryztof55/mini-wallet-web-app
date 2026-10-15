import { cn } from '@/shared/lib/cn';

/**
 * Plain module (no 'use client') so Server Components can style links as buttons: a function
 * exported from a client module cannot be called on the server.
 */
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
