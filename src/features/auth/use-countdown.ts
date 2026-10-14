'use client';

import { useEffect, useState } from 'react';

export type Countdown = { readonly remainingSec: number; readonly available: boolean };

function remaining(targetMs: number | null, nowMs: number): number {
  return targetMs === null ? 0 : Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
}

/**
 * Seconds left until `targetMs` (UIR-AUTH-11). The target comes from the server's answer, so
 * the client never decides validity, it only displays the wait. Ticks once per second and
 * stops at zero.
 */
export function useCountdown(targetMs: number | null, now: () => number = Date.now): Countdown {
  const [clock, setClock] = useState(() => ({ target: targetMs, nowMs: now() }));
  // New target: restart from the current time during render (no effect round-trip).
  if (clock.target !== targetMs) setClock({ target: targetMs, nowMs: now() });

  const remainingSec = remaining(targetMs, clock.target === targetMs ? clock.nowMs : now());

  useEffect(() => {
    if (targetMs === null) return undefined;
    const timer = setInterval(() => {
      const nowMs = now();
      setClock({ target: targetMs, nowMs });
      if (remaining(targetMs, nowMs) === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [targetMs, now]);

  return { remainingSec, available: remainingSec === 0 };
}

/** `m:ss`, e.g. 0:25 or 1:05. */
export function formatCountdown(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
