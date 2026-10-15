'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { buttonClasses } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { CheckIcon } from '@/shared/ui/icons';
import { DetailRow } from '@/shared/components/detail-row';
import { HideBalanceToggle, useHideBalance } from '@/shared/components/hide-balance';
import { MaskedIdentifierText } from '@/shared/components/masked-identifier';
import { MoneyText } from '@/shared/components/money-text';
import { HIGHLIGHT_PARAM } from '@/shared/lib/routes';
import { StartTransferLink } from '@/shared/components/start-transfer-link';
import { t } from '@/shared/lib/i18n/t';
import type { ReceiptView } from '@/shared/api/transfers';
import { ViewHeading } from '@/shared/ui/view-heading';
import { CopyFolioButton } from '@/features/receipt/components/copy-folio-button';

/** "MW-7K3P9Q" → "M W - 7 K 3 P 9 Q": read character by character (FS-04 §13, A11Y-17). */
export function spelledOut(value: string): string {
  return [...value].join(' ');
}

/**
 * Receipt (UIR-CONF-12…14): success heading with focus, the amount first, recipient, concept,
 * date and time, status, folio with "Copiar folio", resulting balance (masked with the Home
 * preference). Actions: "Ir al inicio" (primary, highlights the new movement) and
 * "Enviar otra vez" (same recipient, empty amount).
 */
export function ReceiptDetails({
  receipt,
  completedAt,
}: {
  readonly receipt: ReceiptView;
  /** Already formatted in the user's time zone by the server. */
  readonly completedAt: string;
}) {
  const { hidden } = useHideBalance();
  const concept = receipt.concept?.trim() ?? '';
  const homeHref = `/?${HIGHLIGHT_PARAM}=${encodeURIComponent(receipt.transferId)}` as Route;
  const againHref = `/transfer/again/${encodeURIComponent(receipt.transferId)}` as Route;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-status-success-surface text-status-success">
          <CheckIcon className="size-6" />
        </span>
        <ViewHeading>{t('conf.receipt.title')}</ViewHeading>
      </div>

      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <MoneyText
            value={receipt.amount}
            className="text-4xl font-bold tracking-tight break-all"
          />
          <p className="break-words">
            {t('conf.receipt.to', { name: receipt.recipient.name })}{' '}
            <MaskedIdentifierText
              masked={receipt.recipient.maskedIdentifier}
              className="text-text-secondary"
            />
          </p>
        </div>

        <dl className="flex flex-col gap-3 border-t border-border pt-4">
          {concept !== '' ? (
            <DetailRow label={t('tx.summary.concept')}>
              <span className="break-words">{concept}</span>
            </DetailRow>
          ) : null}
          <DetailRow label={t('conf.receipt.date')}>{completedAt}</DetailRow>
          <DetailRow label={t('conf.receipt.status_label')}>
            <span className="inline-flex items-center gap-1 font-medium text-status-success">
              <CheckIcon className="size-4" />
              {t('conf.receipt.status')}
            </span>
          </DetailRow>
          <DetailRow label={t('conf.receipt.folio')}>
            <span className="flex flex-wrap items-center gap-3">
              <code className="font-mono text-base font-semibold select-all">
                <span aria-hidden="true">{receipt.folio}</span>
                <span className="sr-only">{spelledOut(receipt.folio)}</span>
              </code>
              <CopyFolioButton folio={receipt.folio} />
            </span>
          </DetailRow>
          <DetailRow label={t('conf.receipt.balance')}>
            <span className="flex flex-wrap items-center gap-2">
              <MoneyText value={receipt.balanceAfter} hidden={hidden} className="font-semibold" />
              <HideBalanceToggle />
            </span>
          </DetailRow>
        </dl>
      </Card>

      {/* Small viewports: stacked, primary first; larger: side by side (FS-04 §13). */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={homeHref} className={buttonClasses({ fullWidth: true })}>
          {t('conf.receipt.home')}
        </Link>
        <StartTransferLink
          href={againHref}
          className={buttonClasses({ variant: 'secondary', fullWidth: true })}
        >
          {t('conf.receipt.again')}
        </StartTransferLink>
      </div>
    </div>
  );
}
