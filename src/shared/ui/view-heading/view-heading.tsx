'use client';

import { useEffect, useRef } from 'react';

/** Heading that takes focus on arrival and names the view (A11Y-01, A11Y-02). */
export function ViewHeading({ children }: { readonly children: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    document.title = `${children} · Mini Wallet`;
  }, [children]);
  return (
    <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
      {children}
    </h1>
  );
}
