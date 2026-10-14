'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ThemePreference } from '@/lib/theme';
import { setThemeAction, type SetThemeResult } from '@/server/actions/set-theme';

type ThemeContextValue = {
  readonly theme: ThemePreference;
  readonly setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  /** From the `theme` cookie, read by the root layout so the first paint is already right. */
  readonly initialTheme: ThemePreference;
  /** Persistence; the Server Action by default, a fake in tests. */
  readonly persist?: (theme: ThemePreference) => Promise<SetThemeResult>;
  readonly children: ReactNode;
};

export function ThemeProvider({
  initialTheme,
  persist = setThemeAction,
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState(initialTheme);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      // Apply first: the change is visible immediately and never waits for the network.
      document.documentElement.dataset.theme = next;
      setThemeState(next);
      // Persisting is best effort: if it fails the theme still applies for this visit.
      persist(next).catch(() => undefined);
    },
    [persist],
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
