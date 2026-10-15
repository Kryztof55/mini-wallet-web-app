'use client';

import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { ContactItem } from '@/features/transfer/components/contact-item';
import { useSectionRetry } from '@/shared/hooks/use-section-retry';
import { t } from '@/shared/lib/i18n/t';
import type { ContactsApi } from '@/shared/api/contacts';
import type { ContactView, Loaded } from '@/features/transfer/state/transfer-data';

/**
 * Favorites (UIR-TX-03, UIR-TX-04): most recently used first, each one an action. A failed
 * load shows an error with reference and retry; "Nuevo contacto" stays available (AC-TX-14).
 */
export function FavoritesSection({
  initial,
  api,
  onSelect,
}: {
  readonly initial: Loaded<readonly ContactView[]>;
  readonly api: ContactsApi;
  readonly onSelect: (contact: ContactView) => void;
}) {
  if (initial.ok) return <FavoritesList contacts={initial.value} onSelect={onSelect} />;
  return <FavoritesRetry requestId={initial.requestId} api={api} onSelect={onSelect} />;
}

function FavoritesRetry({
  requestId,
  api,
  onSelect,
}: {
  readonly requestId: string | null;
  readonly api: ContactsApi;
  readonly onSelect: (contact: ContactView) => void;
}) {
  const { state, retry } = useSectionRetry(api.list, requestId);
  if (state.status === 'ready')
    return <FavoritesList contacts={state.data.items} onSelect={onSelect} />;
  return (
    <ErrorState
      title={t('tx.recipient.error')}
      onRetry={() => void retry()}
      retrying={state.status === 'loading'}
      requestId={state.requestId}
      headingLevel={3}
    />
  );
}

function FavoritesList({
  contacts,
  onSelect,
}: {
  readonly contacts: readonly ContactView[];
  readonly onSelect: (contact: ContactView) => void;
}) {
  if (contacts.length === 0) {
    return <EmptyState title={t('tx.recipient.empty')} headingLevel={3} className="py-4" />;
  }
  return (
    <ul className="flex flex-col">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <ContactItem
            name={contact.name}
            maskedIdentifier={contact.maskedIdentifier}
            onSelect={() => onSelect(contact)}
          />
        </li>
      ))}
    </ul>
  );
}
