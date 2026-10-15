import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n/t';

/** Placeholder shape; always hidden from assistive tech (A11Y-19). */
export function Skeleton({ className }: { readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block animate-pulse rounded-md bg-surface-sunken motion-reduce:animate-none',
        className,
      )}
    />
  );
}

/**
 * Wraps the placeholders of a loading region: the region is marked busy and exposes one
 * text alternative ("Cargando…") instead of the shapes (A11Y-19).
 */
export function SkeletonGroup({
  label = t('common.loading'),
  className,
  children,
}: {
  readonly label?: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <div aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
