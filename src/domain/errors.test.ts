import { describe, expect, it } from 'vitest';
import { domainError, isErrorCode } from './errors';

describe('[TS-00 §5] error catalog helpers', () => {
  it('builds errors with and without details', () => {
    expect(domainError('SELF_TRANSFER')).toEqual({ code: 'SELF_TRANSFER' });
    expect(domainError('CODE_INCORRECT', { attemptsLeft: 2 })).toEqual({
      code: 'CODE_INCORRECT',
      details: { attemptsLeft: 2 },
    });
  });

  it('recognizes only catalog codes', () => {
    expect(isErrorCode('INSUFFICIENT_FUNDS')).toBe(true);
    expect(isErrorCode('NETWORK_ERROR')).toBe(false); // client-only, never sent by the server
    expect(isErrorCode(42)).toBe(false);
  });
});
