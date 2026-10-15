import 'server-only';
import { compareByRecentUse, type Contact } from '@/core/contacts';
import { domainError } from '@/core/common';
import { Money } from '@/core/money';
import { err, ok } from '@/core/common';
import { identifierKey, type Identifier } from '@/core/identity';
import type { AttemptKey, ContactId, TransferId, UserId } from '@/core/common';
import type { MockDb } from '@/server/mock/db';
import type { Latency } from '@/server/mock/latency';
import type { Transaction } from '@/core/transfers';
import type { Attempt, Receipt, Repositories } from './ports';

function sortContacts(contacts: readonly Contact[]): Contact[] {
  return [...contacts].sort(compareByRecentUse);
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
        await latency();
        return db.attempts.get(attemptKey(userId, key)) ?? null;
      },
      async claim(userId, key, payloadHash, now) {
        await latency();
        // From here to the return there is no await: the check and the set are atomic.
        const id = attemptKey(userId, key);
        const existing = db.attempts.get(id);
        if (
          existing &&
          (existing.payloadHash !== payloadHash || existing.status !== 'not_processed')
        ) {
          return { claimed: false, existing };
        }
        const attempt: Attempt = {
          userId,
          key,
          payloadHash,
          status: 'in_progress',
          receipt: null,
          failure: null,
          updatedAt: now,
        };
        db.attempts.set(id, attempt);
        return { claimed: true, attempt };
      },
      async save(attempt) {
        db.attempts.set(attemptKey(attempt.userId, attempt.key), attempt);
      },
    },
    receipts: {
      async get(userId, transferId) {
        await latency();
        return db.receipts.get(receiptKey(userId, transferId))?.receipt ?? null;
      },
      async getRecipient(userId, transferId) {
        await latency();
        return db.receipts.get(receiptKey(userId, transferId))?.recipient ?? null;
      },
    },
    ledger: {
      async commitTransfer(commit) {
        await latency();
        // Synchronous from here on: no other request can debit in between (TS-04 §10).
        const balance = db.balances.get(commit.userId) ?? Money.zero();
        const after = Money.subtract(balance, commit.amount);
        if (!after.ok) {
          return err(domainError('INSUFFICIENT_FUNDS', { balanceMinor: balance.amountMinor }));
        }
        db.balances.set(commit.userId, after.value);
        const transaction: Transaction = {
          id: commit.transactionId,
          userId: commit.userId,
          direction: 'out',
          counterparty: {
            name: commit.recipient.name,
            maskedIdentifier: commit.recipient.maskedIdentifier,
          },
          amount: commit.amount,
          concept: commit.concept,
          status: 'completed',
          occurredAt: commit.at,
        };
        db.transactions.set(commit.userId, [
          transaction,
          ...(db.transactions.get(commit.userId) ?? []),
        ]);
        const contactId = commit.recipient.contactId;
        if (contactId) {
          const contacts = db.contacts.get(commit.userId) ?? [];
          db.contacts.set(
            commit.userId,
            contacts.map((c) => (c.id === contactId ? { ...c, lastUsedAt: commit.at } : c)),
          );
        }
        const receipt: Receipt = {
          transferId: commit.transferId,
          folio: commit.folio,
          amount: commit.amount,
          recipient: {
            name: commit.recipient.name,
            maskedIdentifier: commit.recipient.maskedIdentifier,
          },
          concept: commit.concept,
          completedAt: commit.at,
          balanceAfter: after.value,
        };
        db.receipts.set(receiptKey(commit.userId, commit.transferId), {
          receipt,
          recipient: {
            name: commit.recipient.name,
            identifier: commit.recipient.identifier,
            contactId: commit.recipient.contactId,
          },
        });
        return ok(receipt);
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
