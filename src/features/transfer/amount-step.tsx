'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { useAnnounce } from '@/components/ui/live-announcer';
import { Notice } from '@/components/ui/notice';
import { MoneyInput } from '@/components/wallet/money-input';
import { RecipientContext } from '@/components/wallet/recipient-context';
import type { Money } from '@/core/money';
import { validateConcept } from '@/core/transfer-rules';
import { formatMoney } from '@/lib/format/money';
import { t } from '@/lib/i18n/t';
import { CancelTransfer } from './cancel-transfer';
import { ConceptField } from './concept-field';
import type { ContactNotice } from './state/draft';
import { useDraft, useDraftDispatch } from './state/draft-context';
import { StepHeading } from './step-heading';
import { useTransferBalance } from './transfer-data';
import { useAmountField, type AmountError } from './use-amount-field';
import { STEP_PATHS, useStepGuard } from './use-step-guard';

function noticeText(notice: ContactNotice): string {
  if (notice.kind === 'save_failed') return t('tx.contact.save_failed');
  return t(notice.kind === 'saved' ? 'tx.contact.saved' : 'tx.contact.duplicate', {
    name: notice.name,
  });
}

function amountErrorText(error: AmountError, balance: Money | null): string {
  if (error === 'min') return t('tx.amount.error.min');
  return t('tx.amount.error.balance', { balance: balance ? formatMoney(balance) : '' });
}

/** Step 2 (FS-03): amount with live rule feedback, optional concept, balance next to it. */
export function AmountStep() {
  const ready = useStepGuard('amount');
  const draft = useDraft();
  if (!ready || !draft.recipient) return null;
  return <AmountForm />;
}

function AmountForm() {
  const draft = useDraft();
  const dispatch = useDraftDispatch();
  const router = useRouter();
  const announce = useAnnounce();
  const { state: balanceState, retry } = useTransferBalance();
  const balance = balanceState.status === 'ready' ? balanceState.value : null;
  const amount = useAmountField({ initial: draft.amount, balance });
  const [concept, setConcept] = useState(draft.concept);
  const amountRef = useRef<HTMLInputElement>(null);
  const balanceId = useId();
  const notice = draft.notice;
  const recipient = draft.recipient;

  useEffect(() => {
    if (notice) announce(noticeText(notice));
  }, [notice, announce]);

  // The BR-02 error is announced once when it appears, not on every keystroke (FS-03 §13).
  const exceeded = amount.error === 'balance';
  useEffect(() => {
    if (exceeded && balance) announce(amountErrorText('balance', balance));
  }, [exceeded, balance, announce]);

  if (!recipient) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const checked = amount.check();
    if (!checked.ok) {
      if (checked.reason === 'balance_unavailable') announce(t('tx.amount.balance_error'));
      else if (checked.reason === 'min') announce(amountErrorText('min', balance));
      amountRef.current?.focus();
      return;
    }
    const conceptResult = validateConcept(concept);
    dispatch({
      type: 'amountConfirmed',
      amount: checked.amount,
      concept: conceptResult.ok ? (conceptResult.value ?? '') : '',
    });
    dispatch({ type: 'noticeShown' });
    router.push(STEP_PATHS.summary);
  };

  return (
    <div className="flex flex-col gap-6">
      <StepHeading step="amount" title={t('tx.amount.title')} />
      {notice ? (
        <Notice tone={notice.kind === 'save_failed' ? 'warning' : 'success'}>
          {noticeText(notice)}
        </Notice>
      ) : null}
      <RecipientContext name={recipient.name} maskedIdentifier={recipient.maskedIdentifier} />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <MoneyInput
            ref={amountRef}
            label={t('tx.amount.label')}
            display={amount.display}
            onTextChange={amount.change}
            error={amount.error ? amountErrorText(amount.error, balance) : null}
            describedBy={balance ? balanceId : undefined}
          />
          {balanceState.status === 'ready' ? (
            <p id={balanceId} className="text-sm text-text-secondary">
              {t('tx.amount.balance', { balance: formatMoney(balanceState.value) })}
            </p>
          ) : (
            <ErrorState
              title={t('tx.amount.balance_error')}
              onRetry={() => void retry()}
              retrying={balanceState.status === 'loading'}
              requestId={balanceState.requestId}
              headingLevel={2}
            />
          )}
        </div>

        <ConceptField
          value={concept}
          onChange={(next) => {
            setConcept(next);
            dispatch({ type: 'conceptChanged', concept: next });
          }}
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="secondary" onClick={() => router.push(STEP_PATHS.recipient)}>
            {t('common.back')}
          </Button>
          <Button type="submit">{t('common.continue')}</Button>
        </div>
      </form>

      <div className="flex justify-center">
        <CancelTransfer />
      </div>
    </div>
  );
}
