import type { ReactNode } from 'react';

/** Label/value pair inside a `<dl>`; two columns only when there is room (FS-03 §13). */
export function DetailRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-4">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
