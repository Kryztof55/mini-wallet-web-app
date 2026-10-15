/**
 * Client-visible configuration (TS-00 §8): only timings. Values are inlined at build time
 * from NEXT_PUBLIC_* variables, so each one must be referenced literally.
 */
function positive(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function delays(value: string | undefined, fallback: readonly number[]): readonly number[] {
  const parsed = (value ?? '').split(',').map(Number);
  return parsed.length > 0 && parsed.every((n) => Number.isFinite(n) && n > 0) ? parsed : fallback;
}

export const publicConfig = {
  transferSlowMs: positive(process.env.NEXT_PUBLIC_TRANSFER_SLOW_MS, 3000),
  transferTimeoutMs: positive(process.env.NEXT_PUBLIC_TRANSFER_TIMEOUT_MS, 10000),
  transferStatusCheckDelaysMs: delays(
    process.env.NEXT_PUBLIC_TRANSFER_STATUS_CHECK_DELAYS_MS,
    [2000, 4000, 8000],
  ),
} as const;
