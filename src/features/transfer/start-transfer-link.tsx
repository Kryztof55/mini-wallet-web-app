'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { clearTransferCompleted } from './completion-marker';

/** Starting a transfer on purpose clears the completion marker of the previous one (TS-04 §8). */
export function StartTransferLink(props: Omit<ComponentProps<typeof Link>, 'onClick'>) {
  return <Link {...props} onClick={clearTransferCompleted} />;
}
