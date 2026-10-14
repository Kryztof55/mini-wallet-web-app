import { useEffect, type ReactNode } from 'react';
import { LiveAnnouncerProvider } from '@/components/ui/live-announcer';
import type { Identifier } from '@/core/identifier';
import { emptyDraft, type TransferDraft } from './state/draft';
import { TransferDraftProvider, useDraft } from './state/draft-context';
import { TransferDataProvider, type TransferData } from './transfer-data';

export const OWN: readonly Identifier[] = [
  { kind: 'phone', value: '5512345678' } as Identifier,
  { kind: 'email', value: 'ana@demo.mx' } as Identifier,
];

export const FAVORITES = [
  {
    id: 'ct_luis',
    name: 'Luis Pérez',
    maskedIdentifier: '•••• 5432',
    lastUsedAt: '2026-10-14T10:00:00Z',
  },
  {
    id: 'ct_maria',
    name: 'María Torres',
    maskedIdentifier: 'm•••@demo.mx',
    lastUsedAt: '2026-10-10T10:00:00Z',
  },
  { id: 'ct_sofia', name: 'Sofía Díaz', maskedIdentifier: '•••• 4444', lastUsedAt: null },
];

export const transferData = (overrides: Partial<TransferData> = {}): TransferData => ({
  balance: { ok: true, value: { amountMinor: 100000, currency: 'MXN' } },
  favorites: { ok: true, value: FAVORITES },
  ownIdentifiers: OWN,
  ...overrides,
});

/** Exposes the current draft to assertions. */
export const draftProbe: { current: TransferDraft | null } = { current: null };
function DraftProbe() {
  const draft = useDraft();
  useEffect(() => {
    draftProbe.current = draft;
  }, [draft]);
  return null;
}

export function TransferProviders({
  data = transferData(),
  draft = emptyDraft,
  children,
}: {
  readonly data?: TransferData;
  readonly draft?: TransferDraft;
  readonly children: ReactNode;
}) {
  return (
    <LiveAnnouncerProvider>
      <TransferDataProvider value={data}>
        <TransferDraftProvider initialDraft={draft}>
          <DraftProbe />
          {children}
        </TransferDraftProvider>
      </TransferDataProvider>
    </LiveAnnouncerProvider>
  );
}
