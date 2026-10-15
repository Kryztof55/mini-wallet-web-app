import 'server-only';
import type { OutcomeKey, OutcomeWeights } from '@/shared/lib/config';

/** Simulated results of a transfer submission (TS-00 §9.2). */
export const TRANSFER_OUTCOMES = [
  'success',
  'network_error',
  'insufficient_funds',
  'timeout-completed',
  'timeout-not-processed',
  'timeout-unresolved',
  'unknown_error',
] as const;

export type TransferOutcome = (typeof TRANSFER_OUTCOMES)[number];

const FROM_WEIGHT_KEY: Readonly<Record<OutcomeKey, TransferOutcome>> = {
  success: 'success',
  network_error: 'network_error',
  insufficient_funds: 'insufficient_funds',
  // Default timeout sub-case: the transfer completes late (ASM-16).
  timeout: 'timeout-completed',
  unknown_error: 'unknown_error',
};

/** Weighted random pick (ASM-16). `random` returns a number in [0, 1). */
export function pickTransferOutcome(
  weights: OutcomeWeights,
  random: () => number = Math.random,
): TransferOutcome {
  const entries = Object.entries(weights) as [OutcomeKey, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [key, weight] of entries) {
    if (roll < weight) return FROM_WEIGHT_KEY[key];
    roll -= weight;
  }
  return 'success';
}

/** A forced outcome (already validated by `readForcedOutcome`) wins over the random pick. */
export function resolveTransferOutcome(
  forced: TransferOutcome | null,
  weights: OutcomeWeights,
  random: () => number = Math.random,
): TransferOutcome {
  return forced ?? pickTransferOutcome(weights, random);
}
