import { describe, expect, it } from 'vitest';
import {
  canIssueCode,
  evaluateOtpAttempt,
  parseOtpCode,
  type OtpChallenge,
  type OtpPolicy,
} from './otp';

const policy: OtpPolicy = { ttlSec: 300, maxAttempts: 3, resendCooldownSec: 30 };
const issuedAtMs = 1_000_000;
const challenge = (overrides: Partial<OtpChallenge> = {}): OtpChallenge => ({
  identifierKey: 'phone:5512345678',
  code: '123456',
  issuedAtMs,
  failedAttempts: 0,
  locked: false,
  ...overrides,
});

describe('[TC-UNIT-07][BR-11][UIR-AUTH-07] parseOtpCode', () => {
  it.each(['123456', '123 456', '123-456', ' 12 34 56 '])(
    'normalizes %j to 123456 (FS-01 EC-05)',
    (raw) => {
      expect(parseOtpCode(raw)).toEqual({ ok: true, value: '123456' });
    },
  );

  it.each(['12345', '1234567', '12a456', '', 'abcdef'])('rejects %j', (raw) => {
    expect(parseOtpCode(raw)).toEqual({ ok: false, error: { code: 'INVALID_CODE_FORMAT' } });
  });
});

describe('[TC-UNIT-08][BR-12] evaluateOtpAttempt', () => {
  const now = issuedAtMs + 10_000;

  it('accepts the right code within its validity', () => {
    expect(evaluateOtpAttempt(challenge(), '123456', now, policy)).toEqual({ outcome: 'valid' });
  });

  it('counts down attempts on wrong codes, then locks on the third', () => {
    const first = evaluateOtpAttempt(challenge(), '000000', now, policy);
    expect(first).toMatchObject({ outcome: 'incorrect', attemptsLeft: 2 });
    if (first.outcome !== 'incorrect') throw new Error('unexpected');

    const second = evaluateOtpAttempt(first.challenge, '000000', now, policy);
    expect(second).toMatchObject({ outcome: 'incorrect', attemptsLeft: 1 });
    if (second.outcome !== 'incorrect') throw new Error('unexpected');

    const third = evaluateOtpAttempt(second.challenge, '000000', now, policy);
    expect(third).toMatchObject({
      outcome: 'locked',
      challenge: { locked: true, failedAttempts: 3 },
    });
  });

  it('keeps a locked challenge locked, even with the right code', () => {
    expect(evaluateOtpAttempt(challenge({ locked: true }), '123456', now, policy)).toMatchObject({
      outcome: 'locked',
    });
  });

  it('expires after the TTL; the server clock decides (FS-01 EC-13)', () => {
    const late = issuedAtMs + policy.ttlSec * 1000 + 1;
    expect(evaluateOtpAttempt(challenge(), '123456', late, policy)).toEqual({ outcome: 'expired' });
  });

  it('treats a missing challenge as expired', () => {
    expect(evaluateOtpAttempt(null, '123456', now, policy)).toEqual({ outcome: 'expired' });
  });

  it('rejects an older code once a new one was issued (only the latest is valid)', () => {
    const reissued = challenge({ code: '654321', issuedAtMs: now });
    expect(evaluateOtpAttempt(reissued, '123456', now, policy)).toMatchObject({
      outcome: 'incorrect',
    });
  });

  it('never verifies a decoy challenge issued for unknown identifiers (OQ-14)', () => {
    expect(evaluateOtpAttempt(challenge({ code: null }), '123456', now, policy)).toMatchObject({
      outcome: 'incorrect',
    });
  });
});

describe('[TC-UNIT-09][BR-13] canIssueCode', () => {
  it('allows the first code', () => {
    expect(canIssueCode(null, issuedAtMs, policy)).toEqual({ allowed: true });
  });

  it('throttles within the cooldown and reports the remaining seconds', () => {
    expect(canIssueCode(challenge(), issuedAtMs + 10_500, policy)).toEqual({
      allowed: false,
      retryAfterSec: 20,
    });
  });

  it('allows a new code once the cooldown has passed', () => {
    expect(canIssueCode(challenge(), issuedAtMs + 30_000, policy)).toEqual({ allowed: true });
  });

  it('allows a new code immediately when the current one is locked', () => {
    expect(canIssueCode(challenge({ locked: true }), issuedAtMs + 1_000, policy)).toEqual({
      allowed: true,
    });
  });
});
