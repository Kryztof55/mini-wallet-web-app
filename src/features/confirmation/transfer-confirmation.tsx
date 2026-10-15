'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAnnounce } from '@/components/ui/live-announcer';
import { markTransferCompleted } from '@/features/transfer/completion-marker';
import { confirmableDraft, type ConfirmableDraft } from '@/features/transfer/state/draft';
import { useDraft } from '@/features/transfer/state/draft-context';
import { SummaryStep } from '@/features/transfer/summary-step';
import { useTransferBalance } from '@/features/transfer/transfer-data';
import { STEP_PATHS } from '@/features/transfer/use-step-guard';
import { t } from '@/lib/i18n/t';
import { HOME_PATH } from '@/lib/routes';
import type { TransferBody, TransfersApi } from './api';
import { OutcomeView, VerifyingView } from './outcome-views';
import { useConfirmTransfer, type ConfirmTimings } from './use-confirm-transfer';

/** Draft → request body (TS-04 §5). A one-off recipient sends its normalized identifier. */
export function transferBody(draft: ConfirmableDraft): TransferBody {
  const concept = draft.concept.trim();
  return {
    recipient:
      draft.recipient.kind === 'contact'
        ? { contactId: draft.recipient.contactId }
        : { name: draft.recipient.name, identifier: draft.recipient.identifier.value },
    amount: { amountMinor: draft.amount.amountMinor, currency: 'MXN' },
    concept: concept === '' ? null : concept,
  };
}

/**
 * The summary step plus everything after "Enviar $X" (FS-04): processing, verifying, the
 * outcome views and, on success, the receipt. The draft is left untouched on success: leaving
 * the transfer layout discards it, and resetting it here would race with the step guard.
 */
export function TransferConfirmation({
  api,
  timings,
}: {
  readonly api?: TransfersApi;
  readonly timings?: ConfirmTimings;
}) {
  const draft = useDraft();
  const router = useRouter();
  const announce = useAnnounce();
  const balance = useTransferBalance();
  const { state, confirm, reset } = useConfirmTransfer({
    ...(api ? { api } : {}),
    ...(timings ? { timings } : {}),
  });

  // One polite announcement per phase (FS-04 §13); outcome views announce via heading focus.
  const phase = state.status === 'processing' ? (state.slow ? 'slow' : 'processing') : state.status;
  useEffect(() => {
    if (phase === 'processing') announce(t('conf.processing'));
    else if (phase === 'slow') announce(t('conf.slow'));
    else if (phase === 'verifying') announce(t('conf.verifying.title'));
  }, [phase, announce]);

  // UIR-CONF-07: success → receipt, replacing the summary in history; Back goes Home.
  const receiptId = state.status === 'completed' ? state.receipt.transferId : null;
  useEffect(() => {
    if (!receiptId) return;
    markTransferCompleted();
    router.replace(`/receipts/${encodeURIComponent(receiptId)}` as Route);
  }, [receiptId, router]);

  const send = (ready: ConfirmableDraft) =>
    void confirm({ body: transferBody(ready), attemptKey: ready.attempt.key });

  if (state.status === 'idle' || state.status === 'processing') {
    return (
      <SummaryStep
        onConfirm={send}
        processing={state.status === 'processing'}
        slow={state.status === 'processing' && state.slow}
      />
    );
  }

  const ready = confirmableDraft(draft);
  if (!ready) return null;
  const details = {
    recipient: ready.recipient,
    amount: ready.amount,
    concept: ready.concept,
  };

  if (state.status === 'verifying') return <VerifyingView details={details} />;
  if (state.status === 'completed') {
    return (
      <p role="status" className="text-text-secondary">
        {t('conf.redirecting')}
      </p>
    );
  }
  return (
    <OutcomeView
      state={state}
      details={details}
      onRetry={() => send(ready)}
      onChangeData={reset}
      onChangeAmount={() => {
        if (state.status === 'insufficientFunds' && state.balance) {
          balance.update(state.balance);
        }
        router.push(STEP_PATHS.amount);
      }}
      onHome={() => router.push(HOME_PATH as Route)}
    />
  );
}
