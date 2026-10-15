import type { SVGProps } from 'react';
import { cn } from '@/shared/lib/cn';

/** Decorative icons: hidden from assistive tech; meaning always comes with text (A11Y-18). */
type IconProps = { readonly className?: string };

function Svg({ className, children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('size-5 shrink-0', className)}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </Svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function InboxIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
      <path d="M5.5 5h13L21 13v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" />
    </Svg>
  );
}

export function Spinner({ className }: IconProps) {
  return (
    <Svg className={cn('animate-spin motion-reduce:animate-none', className)}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Svg>
  );
}
