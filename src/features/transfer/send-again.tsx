'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { t } from '@/lib/i18n/t';
import { clearTransferCompleted } from './completion-marker';
import type { Recipient } from './state/draft';
import { useDraftDispatch } from './state/draft-context';
import { STEP_PATHS } from './use-step-guard';

/**
 * Seeds a new draft with the recipient of a previous transfer and opens the amount step with
 * an empty amount (UIR-CONF-14). Unknown or not owned → the flow starts at step 1.
 */
export function SendAgain({ recipient }: { readonly recipient: Recipient | null }) {
  const dispatch = useDraftDispatch();
  const router = useRouter();

  useEffect(() => {
    clearTransferCompleted();
    if (recipient) {
      dispatch({ type: 'seedRecipient', recipient });
      router.replace(STEP_PATHS.amount);
    } else {
      router.replace(STEP_PATHS.recipient);
    }
  }, [recipient, dispatch, router]);

  return (
    <p role="status" className="text-text-secondary">
      {t('common.loading')}
    </p>
  );
}
