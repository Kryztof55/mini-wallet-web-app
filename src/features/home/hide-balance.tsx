'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { HIDE_BALANCE_COOKIE } from './constants';

/** Per-device preference (UIR-HOME-05), read by the server so the first paint is already masked. */
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

type HideBalance = { readonly hidden: boolean; readonly toggle: () => void };

const HideBalanceContext = createContext<HideBalance | null>(null);

export function writeHideBalanceCookie(hidden: boolean): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${HIDE_BALANCE_COOKIE}=${hidden ? '1' : '0'}; Path=/; Max-Age=${ONE_YEAR_SEC}; SameSite=Lax${secure}`;
}

export function HideBalanceProvider({
  initialHidden,
  children,
}: {
  readonly initialHidden: boolean;
  readonly children: ReactNode;
}) {
  const [hidden, setHidden] = useState(initialHidden);
  const toggle = useCallback(() => {
    setHidden((current) => {
      writeHideBalanceCookie(!current);
      return !current;
    });
  }, []);
  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle]);
  return <HideBalanceContext.Provider value={value}>{children}</HideBalanceContext.Provider>;
}

/** Outside a provider the balance is shown and the toggle does nothing. */
export function useHideBalance(): HideBalance {
  return useContext(HideBalanceContext) ?? { hidden: false, toggle: () => undefined };
}
