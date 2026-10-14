'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose } from '@/components/ui/dialog';
import { t } from '@/lib/i18n/t';
import { HOME_PATH } from '@/lib/routes';
import { hasDraftData } from './state/draft';
import { useDraft, useDraftDispatch } from './state/draft-context';

/**
 * UIR-TX-20: with data entered, ask first (the safe action, "Seguir editando", comes first and
 * is what Escape does); without data, go Home directly. Cancelling discards the draft.
 */
export function CancelTransfer({ dirty = false }: { readonly dirty?: boolean }) {
  const draft = useDraft();
  const dispatch = useDraftDispatch();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // `cancelled` (not `reset`): an empty draft would make the step guard redirect to the
  // recipient step and win over this navigation (found by TC-E2E-14).
  const leave = () => {
    dispatch({ type: 'cancelled' });
    router.push(HOME_PATH as Route);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && !dirty && !hasDraftData(draft)) {
          leave();
          return;
        }
        setOpen(next);
      }}
      title={t('tx.cancel.dialog.title')}
      description={t('tx.cancel.dialog.body')}
      trigger={<Button variant="ghost">{t('tx.cancel')}</Button>}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="secondary">{t('tx.cancel.dialog.keep')}</Button>
          </DialogClose>
          <Button
            onClick={() => {
              setOpen(false);
              leave();
            }}
          >
            {t('tx.cancel.dialog.confirm')}
          </Button>
        </>
      }
    />
  );
}
