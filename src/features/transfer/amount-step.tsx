'use client';

import { useEffect } from 'react';
import { useAnnounce } from '@/components/ui/live-announcer';
import { Notice } from '@/components/ui/notice';
import { RecipientContext } from '@/components/wallet/recipient-context';
import { t } from '@/lib/i18n/t';
import { CancelTransfer } from './cancel-transfer';
import type { ContactNotice } from './state/draft';
import { useDraft } from './state/draft-context';
import { StepHeading } from './step-heading';
import { useStepGuard } from './use-step-guard';

function noticeText(notice: ContactNotice): string {
  if (notice.kind === 'save_failed') return t('tx.contact.save_failed');
  return t(notice.kind === 'saved' ? 'tx.contact.saved' : 'tx.contact.duplicate', {
    name: notice.name,
  });
}

/** Step 2 (FS-03). The amount form is built in TASK-16; this shows the recipient context. */
export function AmountStep() {
  const ready = useStepGuard('amount');
  const draft = useDraft();
  const announce = useAnnounce();
  const notice = draft.notice;

  useEffect(() => {
    if (ready && notice) announce(noticeText(notice));
  }, [ready, notice, announce]);

  if (!ready || !draft.recipient) return null;
  return (
    <div className="flex flex-col gap-6">
      <StepHeading step="amount" title={t('tx.amount.title')} />
      {notice ? (
        <Notice tone={notice.kind === 'save_failed' ? 'warning' : 'success'}>
          {noticeText(notice)}
        </Notice>
      ) : null}
      <RecipientContext
        name={draft.recipient.name}
        maskedIdentifier={draft.recipient.maskedIdentifier}
      />
      <div className="flex justify-center">
        <CancelTransfer />
      </div>
    </div>
  );
}
