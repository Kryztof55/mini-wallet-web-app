import 'server-only';

export const MOCK_OUTCOME_HEADER = 'x-mock-outcome';

export type ForcedOutcome<T extends string> = {
  /** The forced value, or null when absent, not allowed here, or mock controls are off. */
  readonly value: T | null;
  /** True when a header was sent but ignored (to be logged as `mock.outcome.ignored`). */
  readonly ignored: boolean;
};

/** Reads `x-mock-outcome` only when mock controls are enabled (FR-CONF-11, NFR-10). */
export function readForcedOutcome<T extends string>(
  headers: Headers,
  allowed: readonly T[],
  mockControlsEnabled: boolean,
): ForcedOutcome<T> {
  const raw = headers.get(MOCK_OUTCOME_HEADER);
  if (raw === null) return { value: null, ignored: false };
  if (!mockControlsEnabled || !(allowed as readonly string[]).includes(raw)) {
    return { value: null, ignored: true };
  }
  return { value: raw as T, ignored: false };
}
