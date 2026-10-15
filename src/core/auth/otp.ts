import { domainError, type DomainError } from '@/core/common';
import { err, ok, type Result } from '@/core/common';

export const OTP_LENGTH = 6;

export type OtpPolicy = {
  readonly ttlSec: number;
  readonly maxAttempts: number;
  readonly resendCooldownSec: number;
};

/**
 * The latest one-time code issued for an identifier. Issuing a new code replaces the previous
 * challenge, so older codes stop working (BR-12). `code: null` is a decoy issued for unknown
 * identifiers: it can never verify (OQ-14).
 */
export type OtpChallenge = {
  readonly identifierKey: string;
  readonly code: string | null;
  readonly issuedAtMs: number;
  readonly failedAttempts: number;
  readonly locked: boolean;
};

/** BR-11: exactly six digits once spaces and dashes are removed. */
export function parseOtpCode(raw: string): Result<string, DomainError<'INVALID_CODE_FORMAT'>> {
  const code = raw.replace(/[\s-]/g, '');
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) {
    return err(domainError('INVALID_CODE_FORMAT'));
  }
  return ok(code);
}

export type OtpAttemptOutcome =
  | { readonly outcome: 'valid' }
  | {
      readonly outcome: 'incorrect';
      readonly attemptsLeft: number;
      readonly challenge: OtpChallenge;
    }
  | { readonly outcome: 'locked'; readonly challenge: OtpChallenge }
  | { readonly outcome: 'expired' };

/**
 * BR-12: a code is valid for `ttlSec` and for at most `maxAttempts` failed attempts.
 * Pure: returns the updated challenge for the caller to persist.
 */
export function evaluateOtpAttempt(
  challenge: OtpChallenge | null,
  code: string,
  nowMs: number,
  policy: OtpPolicy,
): OtpAttemptOutcome {
  if (challenge === null) return { outcome: 'expired' };
  if (challenge.locked) return { outcome: 'locked', challenge };
  if (nowMs - challenge.issuedAtMs > policy.ttlSec * 1000) return { outcome: 'expired' };
  if (challenge.code !== null && challenge.code === code) return { outcome: 'valid' };

  const failedAttempts = challenge.failedAttempts + 1;
  if (failedAttempts >= policy.maxAttempts) {
    return { outcome: 'locked', challenge: { ...challenge, failedAttempts, locked: true } };
  }
  return {
    outcome: 'incorrect',
    attemptsLeft: policy.maxAttempts - failedAttempts,
    challenge: { ...challenge, failedAttempts },
  };
}

export type IssueDecision =
  { readonly allowed: true } | { readonly allowed: false; readonly retryAfterSec: number };

/** BR-13: a new code only after the cooldown, unless the current one is locked. */
export function canIssueCode(
  current: OtpChallenge | null,
  nowMs: number,
  policy: OtpPolicy,
): IssueDecision {
  if (current === null || current.locked) return { allowed: true };
  const elapsedMs = nowMs - current.issuedAtMs;
  const cooldownMs = policy.resendCooldownSec * 1000;
  if (elapsedMs >= cooldownMs) return { allowed: true };
  return { allowed: false, retryAfterSec: Math.ceil((cooldownMs - elapsedMs) / 1000) };
}
