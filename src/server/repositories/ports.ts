import 'server-only';
import type { Contact } from '@/core/contact';
import type { Identifier } from '@/core/identifier';
import type { AttemptKey, ContactId, SessionId, TransferId, UserId } from '@/core/ids';
import type { Money } from '@/core/money';
import type { OtpChallenge } from '@/core/otp';
import type { Transaction } from '@/core/transaction';
import type { TransferStatus } from '@/core/transfer-attempt';
import type { User } from '@/core/user';
import type { DomainError } from '@/core/errors';

/**
 * Repository ports (TS-00 §3.1). Services depend on these interfaces only; the in-memory
 * implementations are an infrastructure detail that a real datastore could replace.
 */
export interface UserRepository {
  findByIdentifier(identifier: Identifier): Promise<User | null>;
  findById(id: UserId): Promise<User | null>;
}

export interface AccountRepository {
  getBalance(userId: UserId): Promise<Money | null>;
  setBalance(userId: UserId, balance: Money): Promise<void>;
}

export interface TransactionRepository {
  listRecent(userId: UserId, limit: number): Promise<readonly Transaction[]>;
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

export interface AttemptRepository {
  get(userId: UserId, key: AttemptKey): Promise<Attempt | null>;
  save(attempt: Attempt): Promise<void>;
}

export interface ReceiptRepository {
  get(userId: UserId, transferId: TransferId): Promise<Receipt | null>;
  save(userId: UserId, receipt: Receipt): Promise<void>;
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
};
