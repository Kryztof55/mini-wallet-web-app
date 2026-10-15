'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { compareByRecentUse } from '@/core/contact';
import type { Identifier } from '@/core/identifier';
import type { Money } from '@/core/money';
import type { Result } from '@/core/result';
import { homeApi } from '@/features/home/api';
import type { ClientError } from '@/lib/http/client';

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

export type BalanceState =
  | { readonly status: 'ready'; readonly value: Money }
  | { readonly status: 'error' | 'loading'; readonly requestId: string | null };

export type LoadBalance = () => Promise<Result<Money, ClientError>>;

const loadBalanceFromApi: LoadBalance = async () => {
  const result = await homeApi.getSummary();
  return result.ok ? { ok: true, value: result.value.data.balance } : result;
};

type TransferBalance = {
  readonly state: BalanceState;
  readonly retry: () => Promise<void>;
  /** The server told us the current balance (insufficient funds at confirmation, UIR-CONF-09). */
  readonly update: (balance: Money) => void;
};

type TransferDataValue = TransferData & {
  /** A contact saved during this flow shows up in favorites at once (AC-TX-06). */
  readonly rememberFavorite: (contact: ContactView) => void;
};

const TransferDataContext = createContext<TransferDataValue | null>(null);
const TransferBalanceContext = createContext<TransferBalance | null>(null);

/**
 * Server data for the flow. The balance is also client state: if the server read failed, the
 * amount step retries only `GET /api/me/summary` (UIR-TX-11) and the summary step sees the
 * retried value too.
 */
export function TransferDataProvider({
  value,
  loadBalance = loadBalanceFromApi,
  children,
}: {
  readonly value: TransferData;
  readonly loadBalance?: LoadBalance;
  readonly children: ReactNode;
}) {
  const [state, setState] = useState<BalanceState>(() =>
    value.balance.ok
      ? { status: 'ready', value: value.balance.value }
      : { status: 'error', requestId: value.balance.requestId },
  );
  const inFlight = useRef(false);
  const retry = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState((current) => ({
      status: 'loading',
      requestId: current.status === 'ready' ? null : current.requestId,
    }));
    const result = await loadBalance();
    inFlight.current = false;
    setState(
      result.ok
        ? { status: 'ready', value: result.value }
        : { status: 'error', requestId: result.error.requestId },
    );
  }, [loadBalance]);
  const update = useCallback((next: Money) => setState({ status: 'ready', value: next }), []);

  const [favorites, setFavorites] = useState(value.favorites);
  const rememberFavorite = useCallback((contact: ContactView) => {
    setFavorites((current) =>
      current.ok && !current.value.some((c) => c.id === contact.id)
        ? { ok: true, value: [...current.value, contact].sort(compareByRecentUse) }
        : current,
    );
  }, []);
  const data = useMemo(
    () => ({ ...value, favorites, rememberFavorite }),
    [value, favorites, rememberFavorite],
  );
  const balance = useMemo(() => ({ state, retry, update }), [state, retry, update]);

  return (
    <TransferDataContext.Provider value={data}>
      <TransferBalanceContext.Provider value={balance}>{children}</TransferBalanceContext.Provider>
    </TransferDataContext.Provider>
  );
}

export function useTransferData(): TransferDataValue {
  const data = useContext(TransferDataContext);
  if (!data) throw new Error('useTransferData must be used inside <TransferDataProvider>');
  return data;
}

export function useTransferBalance(): TransferBalance {
  const balance = useContext(TransferBalanceContext);
  if (!balance) throw new Error('useTransferBalance must be used inside <TransferDataProvider>');
  return balance;
}
