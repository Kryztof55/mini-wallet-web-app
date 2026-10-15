'use client';

import type { ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { AlertIcon, Spinner } from '@/shared/ui/icons';
import { ReferenceCode } from '@/shared/ui/reference-code';
import { DetailRow } from '@/shared/components/detail-row';
import { HideBalanceToggle, useHideBalance } from '@/shared/components/hide-balance';
import { MaskedIdentifierText } from '@/shared/components/masked-identifier';
import { MoneyText } from '@/shared/components/money-text';
import type { Money } from '@/core/money';
import { CancelTransfer } from '@/features/transfer/components/cancel-transfer';
import { messages } from '@/shared/lib/i18n/messages.es-MX';
import { t } from '@/shared/lib/i18n/t';
import type { FinalState } from '@/features/transfer/state/confirm-state';
import { ViewHeading } from '@/shared/ui/view-heading';

export type TransferDetails = {
  readonly recipient: { readonly name: string; readonly maskedIdentifier: string };
  readonly amount: Money;
  readonly concept: string;
};

/** What the user was sending, repeated on processing, verifying and error views. */
export function DetailsList({ details }: { readonly details: TransferDetails }) {
  const concept = details.concept.trim();
  return (
    <dl className="flex flex-col gap-3">
      <DetailRow label={t('tx.summary.to')}>
        <span className="font-medium">{details.recipient.name}</span>
        <MaskedIdentifierText
          masked={details.recipient.maskedIdentifier}
          className="block text-sm text-text-secondary"
        />
      </DetailRow>
      <DetailRow label={t('tx.summary.amount')}>
        <MoneyText value={details.amount} className="text-xl font-bold" />
      </DetailRow>
      {concept !== '' ? (
        <DetailRow label={t('tx.summary.concept')}>
          <span className="break-words">{concept}</span>
        </DetailRow>
      ) : null}
    </dl>
  );
}

/** UIR-CONF-04: automatic checks; nothing for the user to do, no time limit for them. */
export function VerifyingView({ details }: { readonly details: TransferDetails }) {
  return (
    <div className="flex flex-col gap-6">
      <ViewHeading>{t('conf.verifying.title')}</ViewHeading>
      <p className="flex items-center gap-2 text-text-secondary">
        <Spinner />
        <span>{t('conf.verifying.body')}</span>
      </p>
      <Card>
        <DetailsList details={details} />
      </Card>
    </div>
  );
}

function OutcomeLayout({
  title,
  children,
  details,
  reference,
  actions,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly details?: TransferDetails;
  readonly reference: string;
  readonly actions: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <AlertIcon className="mt-1.5 size-6 shrink-0 text-status-error" />
        <ViewHeading>{title}</ViewHeading>
      </div>
      <div className="flex flex-col gap-2 text-text-primary">{children}</div>
      {details ? (
        <Card>
          <DetailsList details={details} />
        </Card>
      ) : null}
      <ReferenceCode requestId={reference} />
      {/* Small viewports: stacked, primary first, within thumb reach (FS-04 §13). */}
      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-start">{actions}</div>
    </div>
  );
}

const [FUNDS_BEFORE = ''] = messages['conf.funds.body'].split('{balance}');

function ruleMessage(code: string): string {
  switch (code) {
    case 'RECIPIENT_REQUIRED':
      return t('conf.rule.recipient');
    case 'SELF_TRANSFER':
      return t('tx.contact.identifier.error.self');
    case 'INVALID_AMOUNT':
      return t('tx.amount.error.min');
    case 'INVALID_CONCEPT':
      return t('conf.rule.concept');
    case 'INVALID_IDENTIFIER':
      return t('tx.contact.identifier.error.format');
    default:
      return t('conf.rule.other');
  }
}

/**
 * Every non-success outcome (UIR-CONF-06, 08, 09, 10; FS-04 §8): heading with focus, honest
 * copy (unknown and unresolved never claim the money did or did not move), the reference code
 * (UIR-CONF-11) and the actions each case allows. Retry always reuses the same attempt.
 */
export function OutcomeView({
  state,
  details,
  onRetry,
  onChangeData,
  onChangeAmount,
  onHome,
}: {
  readonly state: Exclude<FinalState, { status: 'completed' }>;
  readonly details: TransferDetails;
  readonly onRetry: () => void;
  readonly onChangeData: () => void;
  readonly onChangeAmount: () => void;
  readonly onHome: () => void;
}) {
  const { hidden } = useHideBalance();
  const retry = <Button onClick={onRetry}>{t('common.retry')}</Button>;
  const home = (
    <Button variant="secondary" onClick={onHome}>
      {t('conf.home')}
    </Button>
  );
  const changeData = (variant: 'primary' | 'secondary') => (
    <Button variant={variant} onClick={onChangeData}>
      {t('conf.change_data')}
    </Button>
  );
  const cancel = <CancelTransfer />;

  switch (state.status) {
    case 'networkError':
    case 'notProcessed': {
      const key = state.status === 'networkError' ? 'network' : 'not_processed';
      return (
        <OutcomeLayout
          title={t(`conf.${key}.title`)}
          details={details}
          reference={state.ref}
          actions={
            <>
              {retry}
              {changeData('secondary')}
              {cancel}
            </>
          }
        >
          <p>{t(`conf.${key}.body`)}</p>
        </OutcomeLayout>
      );
    }
    case 'insufficientFunds':
      return (
        <OutcomeLayout
          title={t('conf.funds.title')}
          details={details}
          reference={state.ref}
          actions={
            <>
              <Button onClick={onChangeAmount}>{t('conf.funds.change_amount')}</Button>
              {cancel}
            </>
          }
        >
          {state.balance ? (
            <>
              <p>
                {FUNDS_BEFORE}
                <MoneyText value={state.balance} hidden={hidden} className="font-semibold" />
              </p>
              <div>
                <HideBalanceToggle />
              </div>
            </>
          ) : (
            <p>{t('conf.funds.body_no_balance')}</p>
          )}
        </OutcomeLayout>
      );
    case 'unknownError':
      return (
        <OutcomeLayout
          title={t('conf.unknown.title')}
          reference={state.ref}
          actions={
            <>
              {retry}
              {home}
            </>
          }
        >
          <p>{t('conf.unknown.body')}</p>
        </OutcomeLayout>
      );
    case 'unresolved':
      return (
        <OutcomeLayout
          title={t('conf.unresolved.title')}
          details={details}
          reference={state.ref}
          actions={
            <>
              {retry}
              {home}
            </>
          }
        >
          <p>{t('conf.unresolved.body')}</p>
        </OutcomeLayout>
      );
    case 'ruleViolation':
      return (
        <OutcomeLayout
          title={t('conf.rule.title')}
          details={details}
          reference={state.ref}
          actions={
            <>
              {changeData('primary')}
              {cancel}
            </>
          }
        >
          <p>{ruleMessage(state.code)}</p>
        </OutcomeLayout>
      );
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}
