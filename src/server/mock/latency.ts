import 'server-only';

export type Latency = () => Promise<void>;

/** Simulated I/O latency so loading states are visible (TS-00 §9.3). */
export function createLatency(
  range: { minMs: number; maxMs: number },
  random: () => number = Math.random,
): Latency {
  return () => {
    const ms = Math.round(range.minMs + random() * (range.maxMs - range.minMs));
    return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
  };
}
