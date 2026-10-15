import 'server-only';
import { randomInt } from 'node:crypto';
import { domainError, type DomainError } from '@/core/common';
import {
  identifierKey,
  maskIdentifier,
  parseIdentifier,
  type MaskedIdentifier,
} from '@/core/identity';
import {
  canIssueCode,
  evaluateOtpAttempt,
  OTP_LENGTH,
  parseOtpCode,
  type OtpChallenge,
  type OtpPolicy,
} from '@/core/auth';
import { err, ok, type Result } from '@/core/common';
import { sanitizeReturnTo, type SafeReturnTo } from '@/core/auth';
import { getConfig } from '@/shared/lib/config';
import { DEFAULT_TIME_ZONE } from '@/shared/lib/format/date';
import { logEvent } from '@/server/logging/logger';
import { getRepositories } from '@/server/repositories';
import type { Repositories, Session } from '@/server/repositories/ports';
import { createSession, destroySession } from '@/server/session/session';

/** Mock outcomes accepted by the auth endpoints (TS-00 §9.3). */
export const AUTH_CODE_OUTCOMES = ['service_unavailable'] as const;
export const AUTH_VERIFY_OUTCOMES = ['service_unavailable', 'otp_expired'] as const;
type CodeOutcome = (typeof AUTH_CODE_OUTCOMES)[number];
type VerifyOutcome = (typeof AUTH_VERIFY_OUTCOMES)[number];

export type CodeIssued = {
  readonly destination: MaskedIdentifier;
  readonly expiresInSec: number;
  readonly resendAvailableInSec: number;
  /**
   * Demo aids, only when mock controls are enabled (UIR-AUTH-16); never in production.
   * A known account gets its code; an unknown identifier gets `demoUnknownAccount` instead
   * of a code that could never verify (owner decision 2026-10-15). In production both are
   * absent, so the response stays identical for known and unknown identifiers (OQ-14).
   */
  readonly demoCode?: string;
  readonly demoUnknownAccount?: true;
};

export type RequestCodeError = DomainError<
  'INVALID_IDENTIFIER' | 'CODE_THROTTLED' | 'SERVICE_UNAVAILABLE'
>;

export type VerifyInput = {
  readonly identifier: string;
  readonly code: string;
  readonly timeZone?: string | undefined;
  readonly returnTo?: string | undefined;
};

export type Verified = {
  readonly firstName: string;
  readonly redirectTo: SafeReturnTo;
  readonly setCookie: string;
};

export type VerifyError = DomainError<
  | 'INVALID_IDENTIFIER'
  | 'INVALID_CODE_FORMAT'
  | 'CODE_INCORRECT'
  | 'CODE_EXPIRED'
  | 'CODE_LOCKED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
>;

export type AuthServiceDeps = {
  readonly repos: Repositories;
  readonly policy: OtpPolicy;
  readonly mockControlsEnabled: boolean;
  readonly now: () => number;
  readonly generateCode: () => string;
};

/** Uniform random 6-digit code from a CSPRNG. */
export function generateOtpCode(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('es-MX', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Login use cases (TS-01 §5): BR-10…BR-13 enforced here, on the server. Unknown identifiers
 * get the same responses as known ones (OQ-14): a decoy challenge with no valid code is
 * stored, so throttling, attempts and lock behave identically.
 */
export function createAuthService(deps: AuthServiceDeps) {
  const { repos, policy } = deps;

  async function requestCode(
    rawIdentifier: string,
    forced: CodeOutcome | null = null,
  ): Promise<Result<CodeIssued, RequestCodeError>> {
    const parsed = parseIdentifier(rawIdentifier);
    if (!parsed.ok) {
      logEvent('info', 'auth.code.rejected', { errorCode: parsed.error.code });
      return err(domainError('INVALID_IDENTIFIER'));
    }
    if (forced === 'service_unavailable') {
      logEvent('error', 'auth.code.request_failed', {
        errorCode: 'SERVICE_UNAVAILABLE',
        forced: true,
      });
      return err(domainError('SERVICE_UNAVAILABLE'));
    }

    const identifier = parsed.value;
    const key = identifierKey(identifier);
    const nowMs = deps.now();
    const decision = canIssueCode(await repos.otp.get(key), nowMs, policy);
    if (!decision.allowed) {
      logEvent('warn', 'auth.code.throttled', { retryAfterSec: decision.retryAfterSec });
      return err(domainError('CODE_THROTTLED', { retryAfterSec: decision.retryAfterSec }));
    }

    const user = await repos.users.findByIdentifier(identifier);
    const code = deps.generateCode();
    if (user) {
      const delivered = await repos.otpDelivery.send(user.id, identifier, code);
      if (!delivered.ok) {
        logEvent('error', 'auth.code.request_failed', { errorCode: delivered.error.code });
        return err(delivered.error);
      }
    }

    const challenge: OtpChallenge = {
      identifierKey: key,
      code: user ? code : null,
      issuedAtMs: nowMs,
      failedAttempts: 0,
      locked: false,
    };
    await repos.otp.save(challenge);
    logEvent('info', 'auth.code.requested', {
      identifierKind: identifier.kind,
      knownAccount: user !== null,
    });

    return ok({
      destination: maskIdentifier(identifier),
      expiresInSec: policy.ttlSec,
      resendAvailableInSec: policy.resendCooldownSec,
      ...(deps.mockControlsEnabled
        ? user
          ? { demoCode: code }
          : { demoUnknownAccount: true as const }
        : {}),
    });
  }

  async function verifyCode(
    input: VerifyInput,
    forced: VerifyOutcome | null = null,
  ): Promise<Result<Verified, VerifyError>> {
    const parsedIdentifier = parseIdentifier(input.identifier);
    if (!parsedIdentifier.ok) {
      logEvent('info', 'auth.verify.rejected', { errorCode: 'INVALID_IDENTIFIER' });
      return err(domainError('INVALID_IDENTIFIER'));
    }
    // BR-11 before touching the challenge: a malformed code never consumes an attempt.
    const parsedCode = parseOtpCode(input.code);
    if (!parsedCode.ok) {
      logEvent('info', 'auth.verify.rejected', { errorCode: 'INVALID_CODE_FORMAT' });
      return err(parsedCode.error);
    }
    if (forced === 'service_unavailable') {
      logEvent('error', 'auth.verify.request_failed', {
        errorCode: 'SERVICE_UNAVAILABLE',
        forced: true,
      });
      return err(domainError('SERVICE_UNAVAILABLE'));
    }

    const identifier = parsedIdentifier.value;
    const key = identifierKey(identifier);
    const nowMs = deps.now();
    let challenge = await repos.otp.get(key);
    if (challenge && forced === 'otp_expired') {
      // Test hook (AC-AUTH-09): age the challenge past its TTL and keep it that way.
      challenge = { ...challenge, issuedAtMs: nowMs - policy.ttlSec * 1000 - 1000 };
      await repos.otp.save(challenge);
    }

    const result = evaluateOtpAttempt(challenge, parsedCode.value, nowMs, policy);
    switch (result.outcome) {
      case 'incorrect':
        await repos.otp.save(result.challenge);
        logEvent('warn', 'auth.verify.failed', {
          reason: 'incorrect',
          attemptsLeft: result.attemptsLeft,
        });
        return err(domainError('CODE_INCORRECT', { attemptsLeft: result.attemptsLeft }));
      case 'locked':
        await repos.otp.save(result.challenge);
        logEvent('warn', 'auth.verify.locked');
        return err(domainError('CODE_LOCKED'));
      case 'expired':
        logEvent('warn', 'auth.verify.failed', { reason: 'expired' });
        return err(domainError('CODE_EXPIRED'));
      case 'valid':
        break;
      default: {
        const exhaustive: never = result;
        return exhaustive;
      }
    }

    // One-time: the code cannot be replayed.
    await repos.otp.delete(key);
    const user = await repos.users.findByIdentifier(identifier);
    if (!user) return err(domainError('INTERNAL_ERROR'));

    const timeZone =
      input.timeZone && isValidTimeZone(input.timeZone) ? input.timeZone : DEFAULT_TIME_ZONE;
    const { setCookie } = await createSession(user.id, timeZone, new Date(nowMs));
    logEvent('info', 'auth.verify.succeeded', { userId: user.id });
    return ok({
      firstName: user.firstName,
      redirectTo: sanitizeReturnTo(input.returnTo),
      setCookie,
    });
  }

  /** Idempotent: without a session it only clears the cookie. */
  async function logout(session: Session | null): Promise<string> {
    if (session) logEvent('info', 'auth.logout', { userId: session.userId });
    return destroySession(session);
  }

  return { requestCode, verifyCode, logout };
}

export type AuthService = ReturnType<typeof createAuthService>;

export function getAuthService(): AuthService {
  const config = getConfig();
  return createAuthService({
    repos: getRepositories(),
    policy: config.otp,
    mockControlsEnabled: config.mockControlsEnabled,
    now: Date.now,
    generateCode: generateOtpCode,
  });
}
