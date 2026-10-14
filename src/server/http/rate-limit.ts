import 'server-only';

export type RateDecision =
  { readonly allowed: true } | { readonly allowed: false; readonly retryAfterSec: number };

/** Fixed-window limiter in memory (single instance; production would use a shared store). */
export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const now = options.now ?? Date.now;
  const windows = new Map<string, { start: number; count: number }>();

  return {
    hit(key: string): RateDecision {
      const t = now();
      const current = windows.get(key);
      if (!current || t - current.start >= options.windowMs) {
        windows.set(key, { start: t, count: 1 });
        return { allowed: true };
      }
      if (current.count >= options.limit) {
        return {
          allowed: false,
          retryAfterSec: Math.ceil((current.start + options.windowMs - t) / 1000),
        };
      }
      current.count += 1;
      return { allowed: true };
    },
  };
}
