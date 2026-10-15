import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { jsonGet, sessionCookieFor, setupApiEnv, teardownApiEnv } from '@/test/api';
import { GET as getSummary } from './summary/route';
import { GET as getTransactions } from './transactions/route';

beforeEach(() => setupApiEnv());
afterEach(() => teardownApiEnv());

async function summaryFor(userId: string, headers: Record<string, string> = {}) {
  return getSummary(
    jsonGet('/api/me/summary', { cookie: await sessionCookieFor(userId), ...headers }),
  );
}

async function transactionsFor(userId: string, query = '') {
  return getTransactions(
    jsonGet(`/api/me/transactions${query}`, { cookie: await sessionCookieFor(userId) }),
  );
}

describe('[TC-INT-06][FR-HOME-01][FR-HOME-02][FR-HOME-03][FR-HOME-10] Home endpoints', () => {
  describe('GET /api/me/summary', () => {
    it('returns first name and balance in minor units, never cached', async () => {
      const response = await summaryFor(SEED_USER_IDS.ana);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({
        firstName: 'Ana',
        balance: { amountMinor: 1234567, currency: 'MXN' },
      });
    });

    it('returns a zero balance as $0.00', async () => {
      expect(await (await summaryFor(SEED_USER_IDS.carla)).json()).toMatchObject({
        balance: { amountMinor: 0 },
      });
    });

    it('503 SERVICE_UNAVAILABLE for the seeded failing user and when forced', async () => {
      const seeded = await summaryFor(SEED_USER_IDS.beto);
      expect(seeded.status).toBe(503);
      expect(await seeded.json()).toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
      const forced = await summaryFor(SEED_USER_IDS.ana, {
        'x-mock-outcome': 'service_unavailable',
      });
      expect(forced.status).toBe(503);
    });

    it('401 without a session', async () => {
      expect((await getSummary(jsonGet('/api/me/summary'))).status).toBe(401);
    });
  });

  describe('GET /api/me/transactions', () => {
    it('returns at most 10 items, newest first, without internal owner IDs', async () => {
      const response = await transactionsFor(SEED_USER_IDS.ana);
      expect(response.headers.get('cache-control')).toBe('no-store');
      const { items } = (await response.json()) as { items: Record<string, unknown>[] };
      expect(items).toHaveLength(10);
      const dates = items.map((item) => String(item.occurredAt));
      expect([...dates].sort().reverse()).toEqual(dates);
      expect(items[0]).not.toHaveProperty('userId');
      expect(items[0]).toMatchObject({
        id: expect.any(String),
        direction: expect.stringMatching(/^(in|out)$/),
        counterparty: { maskedIdentifier: expect.any(String) },
        amount: { amountMinor: expect.any(Number), currency: 'MXN' },
        status: expect.stringMatching(/^(completed|pending|failed)$/),
      });
    });

    it.each([
      ['?limit=3', 3],
      ['?limit=50', 10],
      ['?limit=0', 1],
    ])('clamps the limit %s → %i items', async (query, count) => {
      const { items } = (await (await transactionsFor(SEED_USER_IDS.ana, query)).json()) as {
        items: unknown[];
      };
      expect(items).toHaveLength(count);
    });

    it('400 for a non-numeric limit', async () => {
      expect((await transactionsFor(SEED_USER_IDS.ana, '?limit=abc')).status).toBe(400);
    });

    it('returns an empty list for a user without activity', async () => {
      expect(await (await transactionsFor(SEED_USER_IDS.nico)).json()).toEqual({ items: [] });
    });

    it('503 for the seeded failing user', async () => {
      expect((await transactionsFor(SEED_USER_IDS.marta)).status).toBe(503);
    });

    it('401 without a session', async () => {
      expect((await getTransactions(jsonGet('/api/me/transactions'))).status).toBe(401);
    });
  });
});
