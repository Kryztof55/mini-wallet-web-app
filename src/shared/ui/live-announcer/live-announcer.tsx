'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type Politeness = 'polite' | 'assertive';
type Announce = (message: string, politeness?: Politeness) => void;

const AnnouncerContext = createContext<Announce | null>(null);

/** Delay between clearing and setting the text, so repeating a message is announced again. */
export const ANNOUNCE_DELAY_MS = 100;

/**
 * Page-level live regions (A11Y-08). They exist from the first render, which is what makes
 * screen readers announce later changes reliably. Polite for status, assertive only for
 * blocking errors. Focus never moves.
 */
export function LiveAnnouncerProvider({ children }: { readonly children: ReactNode }) {
  const [messages, setMessages] = useState<Record<Politeness, string>>({
    polite: '',
    assertive: '',
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    clearTimeout(timer.current);
    setMessages((current) => ({ ...current, [politeness]: '' }));
    timer.current = setTimeout(() => {
      setMessages((current) => ({ ...current, [politeness]: message }));
    }, ANNOUNCE_DELAY_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="live-polite">
        {messages.polite}
      </div>
      <div
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="live-assertive"
      >
        {messages.assertive}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce(): Announce {
  const announce = useContext(AnnouncerContext);
  if (!announce) throw new Error('useAnnounce must be used inside <LiveAnnouncerProvider>');
  return announce;
}
