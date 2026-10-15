'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useId, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { t } from '@/shared/lib/i18n/t';
import { contactsApi as defaultApi, type ContactsApi } from '@/shared/api/contacts';
import { CancelTransfer } from '@/features/transfer/components/cancel-transfer';
import { FavoritesSection } from '@/features/transfer/components/favorites-section';
import { NewContactForm } from '@/features/transfer/components/new-contact-form';
import type { ContactNotice, Recipient } from '@/features/transfer/state/draft';
import { useDraftDispatch } from '@/features/transfer/state/draft-context';
import { StepHeading } from '@/features/transfer/components/step-heading';
import { useTransferData } from '@/features/transfer/state/transfer-data';
import { useSaveContact, type SaveFieldError } from '@/features/transfer/hooks/use-save-contact';
import { STEP_PATHS, useStepGuard } from '@/features/transfer/hooks/use-step-guard';

/** Step 1 (FS-03): choose a favorite or add a new contact. */
export function RecipientStep({ api = defaultApi }: { readonly api?: ContactsApi }) {
  const ready = useStepGuard('recipient');
  const { favorites, ownIdentifiers, rememberFavorite } = useTransferData();
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
                if (!outcome.ok) {
                  setServerError(outcome.error);
                  return;
                }
                const { recipient, notice } = outcome;
                if (notice?.kind === 'saved' && recipient.kind === 'contact') {
                  rememberFavorite({
                    id: recipient.contactId,
                    name: recipient.name,
                    maskedIdentifier: recipient.maskedIdentifier,
                    lastUsedAt: null,
                  });
                }
                choose(recipient, notice);
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
