'use client';

import { useEffect } from 'react';

/**
 * Pages restored from the browser's back/forward cache skip the server, so the session gate
 * never runs for them. Reloading on restore sends the request through the proxy again:
 * Back after login doesn't show Login, and Back after logout doesn't show private data
 * (AC-AUTH-06, AC-AUTH-15).
 */
export function BfcacheGuard() {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);
  return null;
}
