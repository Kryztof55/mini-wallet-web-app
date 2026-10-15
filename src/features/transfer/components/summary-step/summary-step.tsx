'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { HideBalanceToggle, useHideBalance } from '@/shared/components/hide-balance';
import { MaskedIdentifierText } from '@/shared/components/masked-identifier';
import { MoneyText } from '@/shared/components/money-text';
import { Money } from '@/core/money';
import { formatMoney } from '@/shared/lib/format/money';
import { t } from '@/shared/lib/i18n/t';
import { Notice } from '@/shared/ui/notice';
import { DetailRow as Row } from '@/shared/components/detail-row';
import { CancelTransfer } from '@/features/transfer/components/cancel-transfer';
import { confirmableDraft, type ConfirmableDraft } from '@/features/transfer/state/draft';
import { useDraft, useDraftDispatch } from '@/features/transfer/state/draft-context';
import { StepHeading } from '@/features/transfer/components/step-heading';
import { useTransferBalance } from '@/features/transfer/state/transfer-data';
import { STEP_PATHS, useStepGuard } from '@/features/transfer/hooks/use-step-guard';

/**
 * Step 3 (FS-03): everything that will be sent, current and resulting balance (masked when the
 * user hides the balance), specific edit actions and "Enviar $X". Reaching it fixes the attempt
 * key for this exact data (BR-07). While the confirmation is processing, the button is busy
 * and editing, cancelling and leaving are not offered (UIR-CONF-01, UIR-CONF-02).
 */
export function SummaryStep({
  onConfirm,
  processing = false,
  slow = false,
}: {
  readonly onConfirm?: (draft: ConfirmableDraft) => void;
  readonly processing?: boolean;
  readonly slow?: boolean;
}) {
  const ready = useStepGuard('summary');
  const draft = useDraft();
  const dispatch = useDraftDispatch();
  const balanceReady = useTransferBalance().state.status === 'ready';

  useEffect(() => {
    if (ready) dispatch({ type: 'summaryReached', newKey: crypto.randomUUID() });
  }, [ready, dispatch]);

  const { recipient, amount } = draft;
  if (!ready || !recipient || !amount) return null;

  const confirm = () => {
    const confirmable = confirmableDraft(draft);
    if (confirmable) onConfirm?.(confirmable);
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

        {processing ? null : (
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
        )}
      </Card>

      {slow ? <Notice tone="info">{t('conf.slow')}</Notice> : null}
      <Button fullWidth busy={processing} busyLabel={t('conf.processing')} onClick={confirm}>
        {t('tx.summary.confirm', { amount: formatMoney(amount) })}
      </Button>
      {processing ? null : (
        <div className="flex justify-center">
          <CancelTransfer />
        </div>
      )}
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
