'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { HOME_PATH } from '@/shared/lib/routes';
import { requiredStep, type TransferStep } from '@/features/transfer/state/draft';
import { clearTransferCompleted, hasTransferCompleted } from '@/shared/lib/transfer-completion';
import { useDraft } from '@/features/transfer/state/draft-context';

export const STEP_PATHS: Record<TransferStep, Route> = {
  recipient: '/transfer/recipient',
  amount: '/transfer/amount',
  summary: '/transfer/summary',
};

const noSubscription = () => () => undefined;

/**
 * UIR-TX-14: a step opened without its prerequisites (deep link, reload) sends the user to the
 * first incomplete step, and renders nothing until then. A finished flow (cancelled in this
 * draft, or a completed transfer marked in session storage, AC-CONF-11) goes Home instead.
 * Returns whether the step may render.
 */
export function useStepGuard(step: TransferStep): boolean {
  const draft = useDraft();
  const router = useRouter();
  // Read on the client only: the server snapshot is false, so hydration never mismatches.
  const marked = useSyncExternalStore(noSubscription, hasTransferCompleted, () => false);
  const finished = draft.completed || marked;
  const missing = finished ? null : requiredStep(draft, step);
  const ready = !finished && missing === null;

  useEffect(() => {
    if (finished) {
      clearTransferCompleted();
      router.replace(HOME_PATH as Route);
    } else if (missing) router.replace(STEP_PATHS[missing]);
  }, [finished, missing, router]);

  return ready;
}
