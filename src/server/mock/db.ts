import 'server-only';
import type { Contact } from '@/core/contacts';
import type { SessionId, UserId } from '@/core/common';
import type { Money } from '@/core/money';
import type { OtpChallenge } from '@/core/auth';
import type { Transaction } from '@/core/transfers';
import type { User } from '@/core/identity';
import type { Attempt, Receipt, Session, TransferRecipientRef } from '@/server/repositories/ports';
import { createSeed, type MockBehaviors } from './seed';

/** In-memory datastore behind the repositories (ASM-03). Lost on restart by design. */
export type MockDb = {
  readonly users: Map<UserId, User>;
  readonly balances: Map<UserId, Money>;
  /** Newest first. */
  readonly transactions: Map<UserId, Transaction[]>;
  readonly contacts: Map<UserId, Contact[]>;
  readonly otp: Map<string, OtpChallenge>;
  readonly sessions: Map<SessionId, Session>;
  readonly attempts: Map<string, Attempt>;
  /** Receipt DTO plus who received it (internal, for "Enviar otra vez"). */
  readonly receipts: Map<
    string,
    { readonly receipt: Receipt; readonly recipient: TransferRecipientRef }
  >;
  readonly behaviors: Map<UserId, MockBehaviors>;
};

export function createMockDb(now: Date = new Date()): MockDb {
  const seed = createSeed(now);
  return {
    users: new Map(seed.users.map((user) => [user.id, user])),
    balances: new Map(seed.balances),
    transactions: new Map([...seed.transactions].map(([id, list]) => [id, [...list]])),
    contacts: new Map([...seed.contacts].map(([id, list]) => [id, [...list]])),
    otp: new Map(),
    sessions: new Map(),
    attempts: new Map(),
    receipts: new Map(),
    behaviors: new Map(seed.behaviors),
  };
}

// One instance per server process, shared by Server Components and Route Handlers,
// and stable across dev hot reloads.
const holder = globalThis as typeof globalThis & { __miniWalletMockDb?: MockDb };

export function getMockDb(): MockDb {
  holder.__miniWalletMockDb ??= createMockDb();
  return holder.__miniWalletMockDb;
}

/** Restores seed data (tests and `POST /api/mock/reset`). */
export function resetMockDb(now: Date = new Date()): MockDb {
  holder.__miniWalletMockDb = createMockDb(now);
  return holder.__miniWalletMockDb;
}
