import { useEffect, type ReactNode } from 'react';
import { LiveAnnouncerProvider } from '@/shared/ui/live-announcer';
import type { Identifier } from '@/core/identifier';
import { emptyDraft, type TransferDraft } from './state/draft';
import { TransferDraftProvider, useDraft } from './state/draft-context';
import { HideBalanceProvider } from '@/shared/components/hide-balance';
import {
  TransferDataProvider,
  type LoadBalance,
  type TransferData,
} from '@/features/transfer/state/transfer-data';

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
  loadBalance,
  hideBalance = false,
  children,
}: {
  readonly data?: TransferData;
  readonly draft?: TransferDraft;
  readonly loadBalance?: LoadBalance;
  readonly hideBalance?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <LiveAnnouncerProvider>
      <TransferDataProvider value={data} {...(loadBalance ? { loadBalance } : {})}>
        <TransferDraftProvider initialDraft={draft}>
          <HideBalanceProvider initialHidden={hideBalance}>
            <DraftProbe />
            {children}
          </HideBalanceProvider>
        </TransferDraftProvider>
      </TransferDataProvider>
    </LiveAnnouncerProvider>
  );
}

export const RECIPIENT = {
  kind: 'contact',
  contactId: 'ct_luis',
  name: 'Luis Pérez',
  maskedIdentifier: '•••• 5432',
} as const;

/** `$X.YZ` as Money without going through a Result. */
export const mxn = (amountMinor: number) => ({ amountMinor, currency: 'MXN' as const });
