import { SEED_USER_IDS } from '@/server/mock/seed';
import { getMockDb } from '@/server/mock/db';
import type { UserId } from '@/core/ids';
import { jsonGet, jsonPost, sessionCookieFor } from './api';

/** A valid transfer from Ana to her favorite Luis: $250.00, "Tacos". */
export const VALID_BODY = {
  recipient: { contactId: 'ctc_ana_luis' },
  amount: { amountMinor: 25000, currency: 'MXN' },
  concept: 'Tacos',
} as const;

export type PostOptions = {
  readonly key?: string;
  readonly userId?: string;
  /** Forced simulator outcome; `null` sends no header (random pick). Default `success`. */
  readonly outcome?: string | null;
  readonly headers?: Record<string, string>;
};

/** `POST /api/transfers` through the real route handler. */
export async function postTransfer(
  handler: (request: Request) => Promise<Response>,
  body: unknown = VALID_BODY,
  options: PostOptions = {},
): Promise<Response> {
  const { key = crypto.randomUUID(), userId = SEED_USER_IDS.ana, outcome = 'success' } = options;
  return handler(
    jsonPost('/api/transfers', body, {
      cookie: await sessionCookieFor(userId),
      'idempotency-key': key,
      ...(outcome ? { 'x-mock-outcome': outcome } : {}),
      ...options.headers,
    }),
  );
}

/** `GET /api/transfers/attempts/{key}` through the real route handler. */
export async function getAttempt(
  handler: (request: Request, context: { params: Promise<{ key: string }> }) => Promise<Response>,
  key: string,
  userId: string = SEED_USER_IDS.ana,
): Promise<Response> {
  return handler(
    jsonGet(`/api/transfers/attempts/${key}`, { cookie: await sessionCookieFor(userId) }),
    { params: Promise.resolve({ key }) },
  );
}

export const balanceOf = (userId: string = SEED_USER_IDS.ana) =>
  getMockDb().balances.get(userId as UserId)?.amountMinor;

export const outgoingCount = (userId: string = SEED_USER_IDS.ana) =>
  (getMockDb().transactions.get(userId as UserId) ?? []).length;
