import { describe, expect, it } from 'vitest';
import { MOCK_OUTCOME_HEADER, readForcedOutcome } from './controls';
import {
  pickTransferOutcome,
  resolveTransferOutcome,
  TRANSFER_OUTCOMES,
  type TransferOutcome,
} from './outcome-simulator';

const weights = {
  success: 60,
  network_error: 10,
  insufficient_funds: 10,
  timeout: 10,
  unknown_error: 10,
};

/** Deterministic sequence covering [0, 1) evenly. */
function evenRandom(steps: number): () => number {
  let i = 0;
  return () => (i++ % steps) / steps;
}

describe('[TC-UNIT-18][ASM-16][FR-CONF-11] outcome simulator', () => {
  it('respects the configured distribution', () => {
    const random = evenRandom(1000);
    const counts = new Map<TransferOutcome, number>();
    for (let i = 0; i < 1000; i += 1) {
      const outcome = pickTransferOutcome(weights, random);
      counts.set(outcome, (counts.get(outcome) ?? 0) + 1);
    }
    expect(Object.fromEntries(counts)).toEqual({
      success: 600,
      network_error: 100,
      insufficient_funds: 100,
      'timeout-completed': 100,
      unknown_error: 100,
    });
  });

  it('maps the timeout weight to the default sub-case (completed late)', () => {
    expect(
      pickTransferOutcome(
        { ...weights, success: 0, network_error: 0, insufficient_funds: 0, unknown_error: 0 },
        () => 0.5,
      ),
    ).toBe('timeout-completed');
  });

  it('lets a forced outcome win over the random pick', () => {
    for (const forced of TRANSFER_OUTCOMES) {
      expect(resolveTransferOutcome(forced, weights, () => 0)).toBe(forced);
    }
    expect(resolveTransferOutcome(null, weights, () => 0)).toBe('success');
  });

  it('honors x-mock-outcome only when mock controls are enabled and the value is allowed here', () => {
    const headers = new Headers({ [MOCK_OUTCOME_HEADER]: 'timeout-unresolved' });
    expect(readForcedOutcome(headers, TRANSFER_OUTCOMES, true)).toEqual({
      value: 'timeout-unresolved',
      ignored: false,
    });
    expect(readForcedOutcome(headers, TRANSFER_OUTCOMES, false)).toEqual({
      value: null,
      ignored: true,
    });
    expect(
      readForcedOutcome(
        new Headers({ [MOCK_OUTCOME_HEADER]: 'otp_expired' }),
        TRANSFER_OUTCOMES,
        true,
      ),
    ).toEqual({
      value: null,
      ignored: true,
    });
    expect(readForcedOutcome(new Headers(), TRANSFER_OUTCOMES, true)).toEqual({
      value: null,
      ignored: false,
    });
  });
});
