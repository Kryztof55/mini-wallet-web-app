'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { t } from '@/lib/i18n/t';
import { contactsApi as defaultApi, type ContactsApi } from './api';
import { CancelTransfer } from './cancel-transfer';
import { FavoritesSection } from './favorites-section';
import { NewContactForm } from './new-contact-form';
import type { ContactNotice, Recipient } from './state/draft';
import { useDraftDispatch } from './state/draft-context';
import { StepHeading } from './step-heading';
import { useTransferData } from './transfer-data';
import { useSaveContact, type SaveFieldError } from './use-save-contact';
import { STEP_PATHS, useStepGuard } from './use-step-guard';

/** Step 1 (FS-03): choose a favorite or add a new contact. */
export function RecipientStep({ api = defaultApi }: { readonly api?: ContactsApi }) {
  const ready = useStepGuard('recipient');
  const { favorites, ownIdentifiers } = useTransferData();
  const dispatch = useDraftDispatch();
  const router = useRouter();
  const { submit, saving } = useSaveContact(api);
  const noFavorites = favorites.ok && favorites.value.length === 0;
  const [formOpen, setFormOpen] = useState(noFavorites);
  const [dirty, setDirty] = useState(false);
  const [serverError, setServerError] = useState<SaveFieldError | null>(null);
  const formId = useId();

  const choose = useCallback(
    (recipient: Recipient, notice?: ContactNotice) => {
      dispatch({ type: 'recipientSelected', recipient, ...(notice ? { notice } : {}) });
      router.push(STEP_PATHS.amount);
    },
    [dispatch, router],
  );

  if (!ready) return null;

  return (
    <div className="flex flex-col gap-6">
      <StepHeading step="recipient" title={t('tx.recipient.title')} />

      <Card as="section" aria-labelledby={`${formId}-favorites`} className="flex flex-col gap-2">
        <h2 id={`${formId}-favorites`} className="text-lg font-semibold">
          {t('tx.recipient.favorites')}
        </h2>
        <FavoritesSection
          initial={favorites}
          api={api}
          onSelect={(contact) =>
            choose({
              kind: 'contact',
              contactId: contact.id,
              name: contact.name,
              maskedIdentifier: contact.maskedIdentifier,
            })
          }
        />
      </Card>

      <Card as="section" aria-labelledby={`${formId}-new`} className="flex flex-col gap-4">
        <h2 id={`${formId}-new`} className="sr-only">
          {t('tx.contact.new')}
        </h2>
        <Button
          variant="secondary"
          fullWidth
          aria-expanded={formOpen}
          aria-controls={`${formId}-form`}
          onClick={() => setFormOpen((open) => !open)}
        >
          {t('tx.contact.new')}
        </Button>
        {formOpen ? (
          <div id={`${formId}-form`}>
            <NewContactForm
              ownIdentifiers={ownIdentifiers}
              saving={saving}
              serverError={serverError}
              onDirtyChange={(next) => {
                setDirty(next);
                setServerError(null);
              }}
              onSubmit={async (input) => {
                const outcome = await submit(input);
                if (!outcome) return;
                if (outcome.ok) choose(outcome.recipient, outcome.notice);
                else setServerError(outcome.error);
              }}
            />
          </div>
        ) : null}
      </Card>

      <div className="flex justify-center">
        <CancelTransfer dirty={dirty} />
      </div>
    </div>
  );
}
