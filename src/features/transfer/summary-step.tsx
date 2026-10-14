'use client';

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HideBalanceToggle } from '@/components/wallet/hide-balance-toggle';
import { MaskedIdentifierText } from '@/components/wallet/masked-identifier';
import { MoneyText } from '@/components/wallet/money-text';
import { Money } from '@/core/money';
import { useHideBalance } from '@/features/home/hide-balance';
import { formatMoney } from '@/lib/format/money';
import { t } from '@/lib/i18n/t';
import { CancelTransfer } from './cancel-transfer';
import type { TransferDraft } from './state/draft';
import { useDraft, useDraftDispatch } from './state/draft-context';
import { StepHeading } from './step-heading';
import { useTransferBalance } from './transfer-data';
import { STEP_PATHS, useStepGuard } from './use-step-guard';

export type ConfirmableDraft = TransferDraft & {
  readonly recipient: NonNullable<TransferDraft['recipient']>;
  readonly amount: Money;
  readonly attempt: NonNullable<TransferDraft['attempt']>;
};

/**
 * Step 3 (FS-03): everything that will be sent, current and resulting balance (masked when the
 * user hides the balance), specific edit actions and "Enviar $X". Reaching it fixes the attempt
 * key for this exact data (BR-07). `onConfirm` is wired by the confirmation flow (TS-04).
 */
export function SummaryStep({
  onConfirm,
}: {
  readonly onConfirm?: (draft: ConfirmableDraft) => void;
}) {
  const ready = useStepGuard('summary');
  const draft = useDraft();
  const dispatch = useDraftDispatch();
  const balanceReady = useTransferBalance().state.status === 'ready';

  useEffect(() => {
    if (ready) dispatch({ type: 'summaryReached', newKey: crypto.randomUUID() });
  }, [ready, dispatch]);

  const { recipient, amount, attempt } = draft;
  if (!ready || !recipient || !amount) return null;

  const confirm = () => {
    if (attempt) onConfirm?.({ ...draft, recipient, amount, attempt });
  };

  return (
    <div className="flex flex-col gap-6">
      <StepHeading step="summary" title={t('tx.summary.title')} />

      <Card className="flex flex-col gap-5">
        <dl className="flex flex-col gap-4">
          <Row label={t('tx.summary.to')}>
            <span className="font-medium">{recipient.name}</span>
            <MaskedIdentifierText
              masked={recipient.maskedIdentifier}
              className="block text-sm text-text-secondary"
            />
          </Row>
          <Row label={t('tx.summary.amount')}>
            <MoneyText value={amount} className="text-3xl font-bold tracking-tight break-all" />
          </Row>
          {draft.concept.trim() !== '' ? (
            <Row label={t('tx.summary.concept')}>
              <span className="break-words">{draft.concept.trim()}</span>
            </Row>
          ) : null}
          <Balances amount={amount} />
        </dl>
        {balanceReady ? (
          <div className="-mt-2">
            <HideBalanceToggle />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4">
          <Link
            href={STEP_PATHS.recipient}
            className="rounded-md px-1 py-1 text-sm font-medium text-text-link hover:underline"
          >
            {t('tx.summary.change_recipient')}
          </Link>
          <Link
            href={STEP_PATHS.amount}
            className="rounded-md px-1 py-1 text-sm font-medium text-text-link hover:underline"
          >
            {t('tx.summary.change_amount')}
          </Link>
        </div>
      </Card>

      <Button fullWidth onClick={confirm}>
        {t('tx.summary.confirm', { amount: formatMoney(amount) })}
      </Button>
      <div className="flex justify-center">
        <CancelTransfer />
      </div>
    </div>
  );
}

/** Label/value pair; two columns only when there is room (FS-03 §13). */
function Row({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-4">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/** Current and resulting balance (UIR-TX-16); hidden together, with the same toggle as Home. */
function Balances({ amount }: { readonly amount: Money }) {
  const { state } = useTransferBalance();
  const { hidden } = useHideBalance();
  if (state.status !== 'ready') return null;
  const after = Money.subtract(state.value, amount);
  return (
    <>
      <Row label={t('tx.summary.balance_now')}>
        <MoneyText value={state.value} hidden={hidden} />
      </Row>
      {after.ok ? (
        <Row label={t('tx.summary.balance_after')}>
          <MoneyText value={after.value} hidden={hidden} className="font-semibold" />
        </Row>
      ) : null}
    </>
  );
}
