import 'server-only';
import { createHash, randomInt } from 'node:crypto';
import { validateContactName } from '@/core/contacts';
import { domainError, type DomainError, type ErrorCode } from '@/core/common';
import { maskIdentifier, parseIdentifier, type Identifier } from '@/core/identity';
import type { AttemptKey, ContactId, TransactionId, TransferId, UserId } from '@/core/common';
import { Money } from '@/core/money';
import { err, ok, type Result } from '@/core/common';
import { validateConcept, validateRecipient } from '@/core/transfers';
import { getConfig, type OutcomeWeights } from '@/shared/lib/config';
import { publicConfig } from '@/shared/lib/public-config';
import { logEvent } from '@/server/logging/logger';
import { resolveTransferOutcome, type TransferOutcome } from '@/server/mock/outcome-simulator';
import { getRepositories } from '@/server/repositories';
import type { Attempt, Receipt, Repositories } from '@/server/repositories/ports';

/** Body of `POST /api/transfers` after schema parsing; the domain decides what is valid (BR-06). */
export type TransferInput = {
  readonly recipient:
    { readonly contactId: string } | { readonly name: string; readonly identifier: string };
  readonly amount: { readonly amountMinor: number; readonly currency: string };
  readonly concept?: string | null | undefined;
};

/** Codes a rule can fail with (422). */
export type RuleError = DomainError<
  | 'INVALID_AMOUNT'
  | 'INSUFFICIENT_FUNDS'
  | 'RECIPIENT_REQUIRED'
  | 'SELF_TRANSFER'
  | 'INVALID_IDENTIFIER'
  | 'INVALID_CONCEPT'
  | 'INVALID_CONTACT_NAME'
>;

export type ConfirmResult =
  | { readonly kind: 'completed'; readonly receipt: Receipt; readonly replayed: boolean }
  /** Same key already being processed by another request (202). */
  | { readonly kind: 'in_progress' }
  /** 422 rule codes, 409 key reused, 503 nothing processed, 500 unknown (TS-04 §5). */
  | { readonly kind: 'error'; readonly error: DomainError };

/** `GET /api/transfers/attempts/{key}` (TS-04 §5). */
export type AttemptStatusView =
  | { readonly status: 'in_progress' }
  | { readonly status: 'completed'; readonly receipt: Receipt }
  | {
      readonly status: 'failed';
      readonly code: ErrorCode;
      readonly details: DomainError['details'] | null;
    }
  | { readonly status: 'not_processed' };

/**
 * Simulated delays for the timeout sub-cases (TS-00 §9.2), derived from the client timings so
 * both sides agree: "late" lands after the client gave up but before its first status check;
 * "unresolved" outlasts the whole verification window.
 */
export function simulatedDelays(timings = publicConfig) {
  const checks = timings.transferStatusCheckDelaysMs;
  const firstCheck = checks[0] ?? 2000;
  const window = checks.reduce((sum, ms) => sum + ms, 0);
  return {
    lateMs: timings.transferTimeoutMs + Math.floor(firstCheck / 2),
    unresolvedMs: timings.transferTimeoutMs + window + 5000,
  } as const;
}

/** Same recipient, amount and concept → same hash (BR-07). Order is fixed, so it is canonical. */
export function payloadHash(input: TransferInput): string {
  const recipient =
    'contactId' in input.recipient
      ? ['contact', input.recipient.contactId]
      : ['oneOff', input.recipient.name.trim(), input.recipient.identifier.trim()];
  const concept = (input.concept ?? '').trim();
  const canonical = JSON.stringify([
    recipient,
    input.amount.amountMinor,
    input.amount.currency,
    concept === '' ? null : concept,
  ]);
  return createHash('sha256').update(canonical).digest('hex');
}

const FOLIO_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L

/** `MW-7K3P9Q` (FS-04 §9.2): short, unambiguous when read aloud or typed. */
export function newFolio(): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) code += FOLIO_ALPHABET[randomInt(FOLIO_ALPHABET.length)];
  return `MW-${code}`;
}

/** Same shape as the client draft's `Recipient` (TS-03 §4). */
export type SendAgainRecipient =
  | {
      readonly kind: 'contact';
      readonly contactId: string;
      readonly name: string;
      readonly maskedIdentifier: string;
    }
  | {
      readonly kind: 'oneOff';
      readonly name: string;
      readonly identifier: Identifier;
      readonly maskedIdentifier: string;
    };

type ValidTransfer = {
  readonly amount: Money;
  readonly concept: string | null;
  readonly recipient: {
    readonly name: string;
    readonly identifier: Identifier;
    readonly contactId: ContactId | null;
  };
};

export type TransfersDeps = {
  readonly repos: Repositories;
  readonly outcomeWeights: () => OutcomeWeights;
  readonly random?: () => number;
  readonly now?: () => Date;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly delays?: ReturnType<typeof simulatedDelays>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Transfer submission (TS-04): idempotent per `(user, key)` (BR-07), every rule re-checked on
 * the server (BR-06), one final outcome per processing round (BR-17), debit atomic with the
 * transfer (TS-04 §10). Outcomes other than success are simulated (TS-00 §9.2).
 */
export function createTransfersService(deps: TransfersDeps) {
  const { repos } = deps;
  const random = deps.random ?? Math.random;
  const now = deps.now ?? (() => new Date());
  const sleep = deps.sleep ?? defaultSleep;
  const delays = deps.delays ?? simulatedDelays();

  async function settle(attempt: Attempt, patch: Partial<Attempt>): Promise<void> {
    await repos.attempts.save({ ...attempt, ...patch, updatedAt: now().toISOString() });
  }

  async function validate(
    userId: UserId,
    input: TransferInput,
  ): Promise<Result<ValidTransfer, RuleError>> {
    // BR-03 / BR-10 / BR-16: who receives it.
    let recipient: ValidTransfer['recipient'];
    if ('contactId' in input.recipient) {
      // A contact of another user is indistinguishable from a missing one.
      const contact = await repos.contacts.findById(userId, input.recipient.contactId as ContactId);
      if (!contact) return err(domainError('RECIPIENT_REQUIRED'));
      recipient = { name: contact.name, identifier: contact.identifier, contactId: contact.id };
    } else {
      const name = validateContactName(input.recipient.name);
      if (!name.ok) return name;
      const identifier = parseIdentifier(input.recipient.identifier);
      if (!identifier.ok) return identifier;
      recipient = { name: name.value, identifier: identifier.value, contactId: null };
    }

    // BR-09: never to one of the sender's own identifiers (EC-12: also for saved favorites).
    const user = await repos.users.findById(userId);
    const self = validateRecipient(recipient.identifier, user?.identifiers ?? []);
    if (!self.ok) return self;

    // BR-04 / BR-01: integer minor units in MXN, more than zero.
    if (input.amount.currency !== 'MXN') {
      return err(domainError('INVALID_AMOUNT', { reason: 'currency' }));
    }
    const amount = Money.fromMinor(input.amount.amountMinor);
    if (!amount.ok) return amount;
    if (Money.isZero(amount.value)) {
      return err(domainError('INVALID_AMOUNT', { reason: 'not_positive' }));
    }

    // BR-15.
    const concept = validateConcept(input.concept ?? '');
    if (!concept.ok) return concept;

    return ok({ amount: amount.value, concept: concept.value, recipient });
  }

  async function commit(
    attempt: Attempt,
    userId: UserId,
    transfer: ValidTransfer,
    startedAt: number,
  ): Promise<ConfirmResult> {
    // The movement shares the transfer's ID, so Home can highlight it after the receipt.
    const id = `trf_${crypto.randomUUID()}`;
    const committed = await repos.ledger.commitTransfer({
      userId,
      transferId: id as TransferId,
      transactionId: id as TransactionId,
      folio: newFolio(),
      amount: transfer.amount,
      recipient: {
        name: transfer.recipient.name,
        identifier: transfer.recipient.identifier,
        maskedIdentifier: maskIdentifier(transfer.recipient.identifier),
        contactId: transfer.recipient.contactId,
      },
      concept: transfer.concept,
      at: now().toISOString(),
    });
    if (!committed.ok) {
      // The balance changed since the pre-check (another transfer won the race).
      await settle(attempt, { status: 'failed', failure: committed.error });
      logEvent('warn', 'tx.confirm.failed', { code: committed.error.code });
      return { kind: 'error', error: committed.error };
    }
    const receipt = committed.value;
    await settle(attempt, { status: 'completed', receipt });
    logEvent('info', 'tx.confirm.completed', {
      transferId: receipt.transferId,
      folio: receipt.folio,
      durationMs: Date.now() - startedAt,
    });
    return { kind: 'completed', receipt, replayed: false };
  }

  async function notProcessed(
    attempt: Attempt,
    code: 'NETWORK_UNAVAILABLE' | 'INTERNAL_ERROR',
  ): Promise<ConfirmResult> {
    await settle(attempt, { status: 'not_processed' });
    if (code === 'NETWORK_UNAVAILABLE') logEvent('warn', 'tx.confirm.network_unavailable');
    else logEvent('error', 'tx.confirm.error', { code });
    return { kind: 'error', error: domainError(code) };
  }

  function replay(existing: Attempt, payloadHashValue: string): ConfirmResult {
    if (existing.payloadHash !== payloadHashValue) {
      logEvent('error', 'tx.confirm.idempotency_conflict', { attemptKey: existing.key });
      return { kind: 'error', error: domainError('IDEMPOTENCY_KEY_REUSED') };
    }
    logEvent('info', 'tx.confirm.replayed', { attemptKey: existing.key, status: existing.status });
    switch (existing.status) {
      case 'in_progress':
        return { kind: 'in_progress' };
      case 'completed':
        return existing.receipt
          ? { kind: 'completed', receipt: existing.receipt, replayed: true }
          : { kind: 'error', error: domainError('INTERNAL_ERROR') };
      case 'failed':
        return { kind: 'error', error: existing.failure ?? domainError('INTERNAL_ERROR') };
      case 'not_processed':
        // A same-payload not_processed attempt is always claimed again, so this is unreachable.
        return { kind: 'error', error: domainError('INTERNAL_ERROR') };
      default: {
        const exhaustive: never = existing.status;
        return exhaustive;
      }
    }
  }

  async function confirm(
    userId: UserId,
    key: AttemptKey,
    input: TransferInput,
    forced: TransferOutcome | null = null,
  ): Promise<ConfirmResult> {
    const startedAt = Date.now();
    const hash = payloadHash(input);
    const claim = await repos.attempts.claim(userId, key, hash, now().toISOString());
    if (!claim.claimed) return replay(claim.existing, hash);
    const attempt = claim.attempt;

    logEvent('info', 'tx.confirm.requested', {
      attemptKey: key,
      amountMinor: Number.isSafeInteger(input.amount.amountMinor) ? input.amount.amountMinor : null,
      recipientKind: 'contactId' in input.recipient ? 'contact' : 'oneOff',
    });

    const valid = await validate(userId, input);
    if (!valid.ok) {
      await settle(attempt, { status: 'failed', failure: valid.error });
      logEvent('info', 'tx.confirm.rejected', { code: valid.error.code });
      return { kind: 'error', error: valid.error };
    }

    // Real rules apply before any simulated outcome (TS-00 §9.2): BR-02 against the balance now.
    const balance = await repos.accounts.getBalance(userId);
    if (!balance.ok) return notProcessed(attempt, 'NETWORK_UNAVAILABLE');
    if (Money.compare(valid.value.amount, balance.value) > 0) {
      const error = domainError('INSUFFICIENT_FUNDS', { balanceMinor: balance.value.amountMinor });
      await settle(attempt, { status: 'failed', failure: error });
      logEvent('warn', 'tx.confirm.failed', { code: error.code });
      return { kind: 'error', error };
    }

    const outcome = resolveTransferOutcome(forced, deps.outcomeWeights(), random);
    switch (outcome) {
      case 'success':
        return commit(attempt, userId, valid.value, startedAt);
      case 'network_error':
        return notProcessed(attempt, 'NETWORK_UNAVAILABLE');
      case 'unknown_error':
        return notProcessed(attempt, 'INTERNAL_ERROR');
      case 'insufficient_funds': {
        const error = domainError('INSUFFICIENT_FUNDS', {
          balanceMinor: balance.value.amountMinor,
        });
        await settle(attempt, { status: 'failed', failure: error });
        logEvent('warn', 'tx.confirm.failed', { code: error.code, simulated: true });
        return { kind: 'error', error };
      }
      case 'timeout-completed':
        // The client gives up first; the transfer completes before its first status check.
        await sleep(delays.lateMs);
        return commit(attempt, userId, valid.value, startedAt);
      case 'timeout-not-processed':
        await sleep(delays.lateMs);
        return notProcessed(attempt, 'NETWORK_UNAVAILABLE');
      case 'timeout-unresolved':
        // Stays in progress past the verification window, then ends without processing.
        await sleep(delays.unresolvedMs);
        return notProcessed(attempt, 'NETWORK_UNAVAILABLE');
      default: {
        const exhaustive: never = outcome;
        return exhaustive;
      }
    }
  }

  async function getAttemptStatus(userId: UserId, key: AttemptKey): Promise<AttemptStatusView> {
    const attempt = await repos.attempts.get(userId, key);
    // Unknown for this user: the server never received it (BR-17).
    const view: AttemptStatusView = !attempt
      ? { status: 'not_processed' }
      : attempt.status === 'completed' && attempt.receipt
        ? { status: 'completed', receipt: attempt.receipt }
        : attempt.status === 'failed'
          ? {
              status: 'failed',
              code: attempt.failure?.code ?? 'INTERNAL_ERROR',
              details: attempt.failure?.details ?? null,
            }
          : attempt.status === 'in_progress'
            ? { status: 'in_progress' }
            : { status: 'not_processed' };
    logEvent('debug', 'tx.status.checked', { attemptKey: key, status: view.status });
    return view;
  }

  /** Only the owner sees a receipt; someone else's is indistinguishable from a missing one. */
  async function getReceipt(
    userId: UserId,
    transferId: string,
  ): Promise<Result<Receipt, DomainError<'NOT_FOUND'>>> {
    const receipt = await repos.receipts.get(userId, transferId as TransferId);
    return receipt ? ok(receipt) : err(domainError('NOT_FOUND'));
  }

  /**
   * "Enviar otra vez" (UIR-CONF-14): the recipient of one of the user's transfers, as a saved
   * favorite if it still exists, otherwise as a one-off recipient. Not owned → NOT_FOUND.
   */
  async function getSendAgainRecipient(
    userId: UserId,
    transferId: string,
  ): Promise<Result<SendAgainRecipient, DomainError<'NOT_FOUND'>>> {
    const ref = await repos.receipts.getRecipient(userId, transferId as TransferId);
    if (!ref) return err(domainError('NOT_FOUND'));
    const contact = ref.contactId ? await repos.contacts.findById(userId, ref.contactId) : null;
    const maskedIdentifier = maskIdentifier(ref.identifier);
    return ok(
      contact
        ? { kind: 'contact', contactId: contact.id, name: contact.name, maskedIdentifier }
        : { kind: 'oneOff', name: ref.name, identifier: ref.identifier, maskedIdentifier },
    );
  }

  return { confirm, getAttemptStatus, getReceipt, getSendAgainRecipient };
}

export type TransfersService = ReturnType<typeof createTransfersService>;

export function getTransfersService(): TransfersService {
  return createTransfersService({
    repos: getRepositories(),
    outcomeWeights: () => getConfig().outcomeWeights,
  });
}
