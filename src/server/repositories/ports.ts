import 'server-only';
import type { Contact } from '@/core/contact';
import type { Identifier, MaskedIdentifier } from '@/core/identifier';
import type {
  AttemptKey,
  ContactId,
  SessionId,
  TransactionId,
  TransferId,
  UserId,
} from '@/core/ids';
import type { Money } from '@/core/money';
import type { OtpChallenge } from '@/core/otp';
import type { Transaction } from '@/core/transaction';
import type { TransferStatus } from '@/core/transfer-attempt';
import type { User } from '@/core/user';
import type { DomainError } from '@/core/errors';
import type { Result } from '@/core/result';

/**
 * Repository ports (TS-00 §3.1). Services depend on these interfaces only; the in-memory
 * implementations are an infrastructure detail that a real datastore could replace.
 */
export interface UserRepository {
  findByIdentifier(identifier: Identifier): Promise<User | null>;
  findById(id: UserId): Promise<User | null>;
}

/** A data source that can be down (seeded failing users, TS-00 §9.1). */
export type SourceError = DomainError<'SERVICE_UNAVAILABLE'>;

export interface AccountRepository {
  /** A user without a stored balance has $0.00. */
  getBalance(userId: UserId): Promise<Result<Money, SourceError>>;
  setBalance(userId: UserId, balance: Money): Promise<void>;
}

export interface TransactionRepository {
  /** Newest first. */
  listRecent(userId: UserId, limit: number): Promise<Result<readonly Transaction[], SourceError>>;
  add(transaction: Transaction): Promise<void>;
}

export type SaveContactResult = { readonly contact: Contact; readonly created: boolean };

export interface ContactRepository {
  list(userId: UserId): Promise<readonly Contact[]>;
  findById(userId: UserId, id: ContactId): Promise<Contact | null>;
  /** BR-08: returns the existing contact when the identifier is already saved. */
  save(userId: UserId, name: string, identifier: Identifier): Promise<SaveContactResult>;
  touch(userId: UserId, id: ContactId, usedAt: string): Promise<void>;
}

export interface OtpChallengeRepository {
  get(identifierKey: string): Promise<OtpChallenge | null>;
  save(challenge: OtpChallenge): Promise<void>;
  delete(identifierKey: string): Promise<void>;
}

export type Session = {
  readonly id: SessionId;
  readonly userId: UserId;
  readonly timeZone: string;
  readonly createdAt: string;
};

export interface SessionRepository {
  create(session: Session): Promise<void>;
  get(id: SessionId): Promise<Session | null>;
  delete(id: SessionId): Promise<void>;
}

export type Receipt = {
  readonly transferId: TransferId;
  readonly folio: string;
  readonly amount: Money;
  readonly recipient: { readonly name: string; readonly maskedIdentifier: string };
  readonly concept: string | null;
  readonly completedAt: string;
  readonly balanceAfter: Money;
};

export type Attempt = {
  readonly userId: UserId;
  readonly key: AttemptKey;
  readonly payloadHash: string;
  readonly status: TransferStatus;
  readonly receipt: Receipt | null;
  readonly failure: DomainError | null;
  readonly updatedAt: string;
};

/** Result of trying to start processing an attempt (BR-07, TS-04 §10). */
export type ClaimResult =
  | { readonly claimed: true; readonly attempt: Attempt }
  | { readonly claimed: false; readonly existing: Attempt };

export interface AttemptRepository {
  get(userId: UserId, key: AttemptKey): Promise<Attempt | null>;
  /**
   * Atomic check-and-set: marks the attempt `in_progress` and returns `claimed: true` when the
   * key is new, or known with the same payload and `not_processed` (a retry may process it).
   * Otherwise returns the stored attempt untouched. Two concurrent calls never both claim.
   */
  claim(userId: UserId, key: AttemptKey, payloadHash: string, now: string): Promise<ClaimResult>;
  save(attempt: Attempt): Promise<void>;
}

export interface ReceiptRepository {
  get(userId: UserId, transferId: TransferId): Promise<Receipt | null>;
}

export type TransferCommit = {
  readonly userId: UserId;
  readonly transferId: TransferId;
  readonly transactionId: TransactionId;
  readonly folio: string;
  readonly amount: Money;
  readonly recipient: {
    readonly name: string;
    readonly maskedIdentifier: MaskedIdentifier;
    readonly contactId: ContactId | null;
  };
  readonly concept: string | null;
  readonly at: string;
};

export interface LedgerRepository {
  /**
   * One atomic operation (TS-04 §10): checks BR-02 against the current balance, debits,
   * records the outgoing transaction and stores the receipt. Nothing changes on failure.
   */
  commitTransfer(
    commit: TransferCommit,
  ): Promise<Result<Receipt, DomainError<'INSUFFICIENT_FUNDS'>>>;
}

/**
 * Sends a one-time code to the user (SMS or email in production). The mock never sends;
 * it fails for seeded users marked `codeRequestFails` (TS-00 §9.3).
 */
export interface OtpDelivery {
  send(
    userId: UserId,
    destination: Identifier,
    code: string,
  ): Promise<Result<void, DomainError<'SERVICE_UNAVAILABLE'>>>;
}

export type Repositories = {
  readonly users: UserRepository;
  readonly accounts: AccountRepository;
  readonly transactions: TransactionRepository;
  readonly contacts: ContactRepository;
  readonly otp: OtpChallengeRepository;
  readonly sessions: SessionRepository;
  readonly attempts: AttemptRepository;
  readonly receipts: ReceiptRepository;
  readonly ledger: LedgerRepository;
  readonly otpDelivery: OtpDelivery;
};
