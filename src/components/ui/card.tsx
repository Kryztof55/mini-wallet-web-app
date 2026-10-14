import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CardProps = HTMLAttributes<HTMLElement> & {
  /** `section` when the card has its own heading; `div` otherwise. */
  readonly as?: 'div' | 'section' | 'article';
};

export function Card({ as: Element = 'div', className, ...rest }: CardProps) {
  return (
    <Element
      className={cn('rounded-lg border border-border bg-surface-raised p-4 sm:p-6', className)}
      {...rest}
    />
  );
}
