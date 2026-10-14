import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { setLogger } from '@/server/logging/logger';
import { captureLogs } from '@/test/capture-logs';
import { setupApiEnv, teardownApiEnv } from '@/test/api';
import { balanceOf, outgoingCount, postTransfer, VALID_BODY } from '@/test/transfers';
import { POST } from './route';

afterEach(() => {
  setLogger(undefined);
  teardownApiEnv();
});

const ANA_BALANCE = 1234567;

describe('[TC-INT-09][BR-07][FR-CONF-08][AC-CONF-04] POST /api/transfers — idempotency', () => {
  beforeEach(() => setupApiEnv());

  it('same key and payload → the stored 201 again (same folio), debited once', async () => {
    const key = crypto.randomUUID();
    const first = await postTransfer(POST, VALID_BODY, { key });
    const again = await postTransfer(POST, VALID_BODY, { key, outcome: 'network_error' });
    expect(first.status).toBe(201);
    expect(again.status).toBe(201);
    const [a, b] = [await first.json(), await again.json()];
    expect(b).toEqual(a);
    expect(balanceOf()).toBe(ANA_BALANCE - 25000);
    expect(outgoingCount()).toBe(26); // 25 seeded + 1
  });

  it('same key with another payload → 409 IDEMPOTENCY_KEY_REUSED, nothing debited', async () => {
    const logs = captureLogs();
    const key = crypto.randomUUID();
    await postTransfer(POST, VALID_BODY, { key });
    const other = await postTransfer(
      POST,
      { ...VALID_BODY, amount: { amountMinor: 30000, currency: 'MXN' } },
      { key },
    );
    expect(other.status).toBe(409);
    expect(await other.json()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    expect(balanceOf()).toBe(ANA_BALANCE - 25000);
    expect(logs.some((l) => l.event === 'tx.confirm.idempotency_conflict')).toBe(true);
  });

  it('a rule failure is final for that key: the retry returns the same 422', async () => {
    const key = crypto.randomUUID();
    const body = { ...VALID_BODY, amount: { amountMinor: ANA_BALANCE + 1, currency: 'MXN' } };
    const first = await postTransfer(POST, body, { key });
    const again = await postTransfer(POST, body, { key });
    expect([first.status, again.status]).toEqual([422, 422]);
    expect(await again.json()).toMatchObject({ code: 'INSUFFICIENT_FUNDS' });
  });

  it('not_processed is processed again by a retry with the same key', async () => {
    const key = crypto.randomUUID();
    const failed = await postTransfer(POST, VALID_BODY, { key, outcome: 'network_error' });
    expect(failed.status).toBe(503);
    expect(await failed.json()).toMatchObject({ code: 'NETWORK_UNAVAILABLE' });
    expect(balanceOf()).toBe(ANA_BALANCE);

    const retried = await postTransfer(POST, VALID_BODY, { key });
    expect(retried.status).toBe(201);
    expect(balanceOf()).toBe(ANA_BALANCE - 25000);
  });
});

describe('[TC-INT-09][BR-07] concurrency (simulated latency, so requests overlap)', () => {
  beforeEach(() => setupApiEnv({ MOCK_LATENCY_MS: '20-20' }));

  it('two requests with the same key at once → one debit; the other gets 202 in progress', async () => {
    const key = crypto.randomUUID();
    const responses = await Promise.all([
      postTransfer(POST, VALID_BODY, { key }),
      postTransfer(POST, VALID_BODY, { key }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 202]);
    const pending = responses.find((r) => r.status === 202);
    expect(await pending?.json()).toEqual({ status: 'in_progress' });
    expect(balanceOf()).toBe(ANA_BALANCE - 25000);
    expect(outgoingCount()).toBe(26);
  });

  it('two different transfers racing for the same money → only one is debited (atomic BR-02)', async () => {
    // Nico has $500.00: each $300.00 fits alone, both together do not.
    const body = {
      recipient: { name: 'Pedro Gómez', identifier: '5587654321' },
      amount: { amountMinor: 30000, currency: 'MXN' },
    };
    const options = { userId: SEED_USER_IDS.nico };
    const responses = await Promise.all([
      postTransfer(POST, body, options),
      postTransfer(POST, body, options),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 422]);
    const rejected = responses.find((r) => r.status === 422);
    expect(await rejected?.json()).toMatchObject({ code: 'INSUFFICIENT_FUNDS' });
    expect(balanceOf(SEED_USER_IDS.nico)).toBe(20000);
  });
});
