import 'server-only';
import type { Contact } from '@/core/contact';
import { domainError } from '@/core/errors';
import { Money } from '@/core/money';
import { err, ok } from '@/core/result';
import { identifierKey, type Identifier } from '@/core/identifier';
import type { AttemptKey, ContactId, TransferId, UserId } from '@/core/ids';
import type { MockDb } from '@/server/mock/db';
import type { Latency } from '@/server/mock/latency';
import type { Repositories } from './ports';

const byRecentUse = new Intl.Collator('es-MX');

function sortContacts(contacts: readonly Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    if (a.lastUsedAt !== b.lastUsedAt) {
      if (a.lastUsedAt === null) return 1;
      if (b.lastUsedAt === null) return -1;
      return b.lastUsedAt.localeCompare(a.lastUsedAt);
    }
    return byRecentUse.compare(a.name, b.name);
  });
}

/** Repositories over the in-memory datastore; every call waits the simulated latency. */
export function createInMemoryRepositories(db: MockDb, latency: Latency): Repositories {
  const attemptKey = (userId: UserId, key: AttemptKey) => `${userId}:${key}`;
  const receiptKey = (userId: UserId, id: TransferId) => `${userId}:${id}`;

  return {
    users: {
      async findByIdentifier(identifier: Identifier) {
        await latency();
        const key = identifierKey(identifier);
        for (const user of db.users.values()) {
          if (user.identifiers.some((own) => identifierKey(own) === key)) return user;
        }
        return null;
      },
      async findById(id) {
        await latency();
        return db.users.get(id) ?? null;
      },
    },
    accounts: {
      async getBalance(userId) {
        await latency();
        if (db.behaviors.get(userId)?.summaryFails) return err(domainError('SERVICE_UNAVAILABLE'));
        return ok(db.balances.get(userId) ?? Money.zero());
      },
      async setBalance(userId, balance) {
        db.balances.set(userId, balance);
      },
    },
    transactions: {
      async listRecent(userId, limit) {
        await latency();
        if (db.behaviors.get(userId)?.activityFails) return err(domainError('SERVICE_UNAVAILABLE'));
        return ok((db.transactions.get(userId) ?? []).slice(0, limit));
      },
      async add(transaction) {
        const list = db.transactions.get(transaction.userId) ?? [];
        db.transactions.set(transaction.userId, [transaction, ...list]);
      },
    },
    contacts: {
      async list(userId) {
        await latency();
        return sortContacts(db.contacts.get(userId) ?? []);
      },
      async findById(userId, id) {
        await latency();
        return (db.contacts.get(userId) ?? []).find((contact) => contact.id === id) ?? null;
      },
      async save(userId, name, identifier) {
        await latency();
        const list = db.contacts.get(userId) ?? [];
        const key = identifierKey(identifier);
        const existing = list.find((contact) => identifierKey(contact.identifier) === key);
        if (existing) return { contact: existing, created: false };
        const contact: Contact = {
          id: `ctc_${crypto.randomUUID()}` as ContactId,
          userId,
          name,
          identifier,
          lastUsedAt: null,
        };
        db.contacts.set(userId, [...list, contact]);
        return { contact, created: true };
      },
      async touch(userId, id, usedAt) {
        const list = db.contacts.get(userId) ?? [];
        db.contacts.set(
          userId,
          list.map((c) => (c.id === id ? { ...c, lastUsedAt: usedAt } : c)),
        );
      },
    },
    otp: {
      async get(key) {
        return db.otp.get(key) ?? null;
      },
      async save(challenge) {
        db.otp.set(challenge.identifierKey, challenge);
      },
      async delete(key) {
        db.otp.delete(key);
      },
    },
    sessions: {
      async create(session) {
        db.sessions.set(session.id, session);
      },
      async get(id) {
        return db.sessions.get(id) ?? null;
      },
      async delete(id) {
        db.sessions.delete(id);
      },
    },
    attempts: {
      async get(userId, key) {
        return db.attempts.get(attemptKey(userId, key)) ?? null;
      },
      async save(attempt) {
        db.attempts.set(attemptKey(attempt.userId, attempt.key), attempt);
      },
    },
    receipts: {
      async get(userId, transferId) {
        await latency();
        return db.receipts.get(receiptKey(userId, transferId)) ?? null;
      },
      async save(userId, receipt) {
        db.receipts.set(receiptKey(userId, receipt.transferId), receipt);
      },
    },
    otpDelivery: {
      async send(userId) {
        await latency();
        return db.behaviors.get(userId)?.codeRequestFails
          ? err(domainError('SERVICE_UNAVAILABLE'))
          : ok(undefined);
      },
    },
  };
}
