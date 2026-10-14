'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Identifier } from '@/core/identifier';
import type { Money } from '@/core/money';

export type ContactView = {
  readonly id: string;
  readonly name: string;
  readonly maskedIdentifier: string;
  readonly lastUsedAt: string | null;
};

/** A server read that may have failed; `requestId` feeds the reference code. */
export type Loaded<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly requestId: string | null };

/** Read on the server by the transfer layout (TS-03 §7). */
export type TransferData = {
  readonly balance: Loaded<Money>;
  readonly favorites: Loaded<readonly ContactView[]>;
  /** The user's own phone/email, for the BR-09 check while typing (the server re-checks). */
  readonly ownIdentifiers: readonly Identifier[];
};

const TransferDataContext = createContext<TransferData | null>(null);

export function TransferDataProvider({
  value,
  children,
}: {
  readonly value: TransferData;
  readonly children: ReactNode;
}) {
  return <TransferDataContext.Provider value={value}>{children}</TransferDataContext.Provider>;
}

export function useTransferData(): TransferData {
  const data = useContext(TransferDataContext);
  if (!data) throw new Error('useTransferData must be used inside <TransferDataProvider>');
  return data;
}
