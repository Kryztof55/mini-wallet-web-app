'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HOME_PATH } from '@/lib/routes';
import { requiredStep, type TransferStep } from './state/draft';
import { useDraft } from './state/draft-context';

export const STEP_PATHS: Record<TransferStep, Route> = {
  recipient: '/transfer/recipient',
  amount: '/transfer/amount',
  summary: '/transfer/summary',
};

/**
 * UIR-TX-14: a step opened without its prerequisites (deep link, reload) sends the user to the
 * first incomplete step, and renders nothing until then. A completed transfer goes Home.
 * Returns whether the step may render.
 */
export function useStepGuard(step: TransferStep): boolean {
  const draft = useDraft();
  const router = useRouter();
  const missing = draft.completed ? null : requiredStep(draft, step);
  const ready = !draft.completed && missing === null;

  useEffect(() => {
    if (draft.completed) router.replace(HOME_PATH as Route);
    else if (missing) router.replace(STEP_PATHS[missing]);
  }, [draft.completed, missing, router]);

  return ready;
}
