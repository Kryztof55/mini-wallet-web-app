import { describe, expect, it } from 'vitest';
import { isFinalStatus, transitionAttempt, type TransferStatus } from './transfer-attempt';

describe('[TC-UNIT-12][BR-17] transfer attempt status transitions', () => {
  it.each<[TransferStatus, TransferStatus]>([
    ['in_progress', 'completed'],
    ['in_progress', 'failed'],
    ['in_progress', 'not_processed'],
    ['not_processed', 'in_progress'],
  ])('allows %s → %s', (from, to) => {
    expect(transitionAttempt(from, to)).toEqual({ ok: true, value: to });
  });

  it.each<[TransferStatus, TransferStatus]>([
    ['completed', 'failed'],
    ['completed', 'in_progress'],
    ['failed', 'completed'],
    ['failed', 'in_progress'],
    ['not_processed', 'completed'],
    ['in_progress', 'in_progress'],
  ])('forbids %s → %s', (from, to) => {
    expect(transitionAttempt(from, to).ok).toBe(false);
  });

  it('marks completed and failed as final, the rest as not final', () => {
    expect(isFinalStatus('completed')).toBe(true);
    expect(isFinalStatus('failed')).toBe(true);
    expect(isFinalStatus('in_progress')).toBe(false);
    expect(isFinalStatus('not_processed')).toBe(false);
  });
});
