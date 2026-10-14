import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { setLogger } from '@/server/logging/logger';
import { simulatedDelays } from '@/server/services/transfers.service';
import { captureLogs } from '@/test/capture-logs';
import { setupApiEnv, teardownApiEnv } from '@/test/api';
import { balanceOf, getAttempt, postTransfer, VALID_BODY } from '@/test/transfers';
import { GET } from './attempts/[key]/route';
import { POST } from './route';

const ANA_BALANCE = 1234567;
const { lateMs, unresolvedMs } = simulatedDelays();

/**
 * The request reaches its simulated delay after real async work (session HMAC). Wait for that
 * timer with real event-loop turns: `vi.waitFor` would advance the fake clock while polling.
 */
async function untilDelayed() {
  for (let turn = 0; turn < 1000 && vi.getTimerCount() === 0; turn += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  expect(vi.getTimerCount()).toBe(1);
}

async function statusOf(key: string, userId?: string) {
  const response = await getAttempt(GET, key, userId);
  expect(response.status).toBe(200);
  return response.json();
}

afterEach(() => {
  vi.useRealTimers();
  setLogger(undefined);
  teardownApiEnv();
});

describe('[TC-INT-10][FR-CONF-11][UIR-CONF-17][BR-17] forced outcomes and attempt status', () => {
  beforeEach(() => setupApiEnv());

  it('success → 201; status completed with the same receipt', async () => {
    const key = crypto.randomUUID();
    const response = await postTransfer(POST, VALID_BODY, { key, outcome: 'success' });
    expect(response.status).toBe(201);
    const receipt = await response.json();
    expect(await statusOf(key)).toEqual({ status: 'completed', receipt });
  });

  it('network_error → 503 NETWORK_UNAVAILABLE; nothing processed', async () => {
    const key = crypto.randomUUID();
    const response = await postTransfer(POST, VALID_BODY, { key, outcome: 'network_error' });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'NETWORK_UNAVAILABLE' });
    expect(await statusOf(key)).toEqual({ status: 'not_processed' });
    expect(balanceOf()).toBe(ANA_BALANCE);
  });

  it('insufficient_funds → 422 with the balance; status failed with the code', async () => {
    const key = crypto.randomUUID();
    const response = await postTransfer(POST, VALID_BODY, { key, outcome: 'insufficient_funds' });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      code: 'INSUFFICIENT_FUNDS',
      details: { balanceMinor: ANA_BALANCE },
    });
    expect(await statusOf(key)).toEqual({
      status: 'failed',
      code: 'INSUFFICIENT_FUNDS',
      details: { balanceMinor: ANA_BALANCE },
    });
    expect(balanceOf()).toBe(ANA_BALANCE);
  });

  it('unknown_error → 500 INTERNAL_ERROR; nothing processed', async () => {
    const key = crypto.randomUUID();
    const response = await postTransfer(POST, VALID_BODY, { key, outcome: 'unknown_error' });
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(await statusOf(key)).toEqual({ status: 'not_processed' });
    expect(balanceOf()).toBe(ANA_BALANCE);
  });

  it('a rule rejection is reported by the status endpoint as failed', async () => {
    const key = crypto.randomUUID();
    await postTransfer(POST, { ...VALID_BODY, concept: 'x'.repeat(41) }, { key });
    expect(await statusOf(key)).toMatchObject({ status: 'failed', code: 'INVALID_CONCEPT' });
  });

  it("unknown, malformed or another user's key → not_processed (never received)", async () => {
    const key = crypto.randomUUID();
    await postTransfer(POST, VALID_BODY, { key });
    expect(await statusOf(crypto.randomUUID())).toEqual({ status: 'not_processed' });
    expect(await statusOf('not-a-uuid')).toEqual({ status: 'not_processed' });
    expect(await statusOf(key, SEED_USER_IDS.nico)).toEqual({ status: 'not_processed' });
  });
});

describe('[TC-INT-10][AC-CONF-15][AC-CONF-16] timeout sub-cases (fake timers)', () => {
  beforeEach(() => {
    setupApiEnv();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  it('timeout-completed: in progress while the client waits, completed before its first check', async () => {
    const key = crypto.randomUUID();
    const pending = postTransfer(POST, VALID_BODY, { key, outcome: 'timeout-completed' });
    await untilDelayed();
    await vi.advanceTimersByTimeAsync(lateMs - 1);
    expect(await statusOf(key)).toEqual({ status: 'in_progress' });
    expect(balanceOf()).toBe(ANA_BALANCE);

    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).status).toBe(201);
    expect(await statusOf(key)).toMatchObject({ status: 'completed' });
    expect(balanceOf()).toBe(ANA_BALANCE - 25000);
  });

  it('timeout-not-processed: in progress, then not_processed and nothing debited', async () => {
    const key = crypto.randomUUID();
    const pending = postTransfer(POST, VALID_BODY, { key, outcome: 'timeout-not-processed' });
    await untilDelayed();
    await vi.advanceTimersByTimeAsync(lateMs - 1);
    expect(await statusOf(key)).toEqual({ status: 'in_progress' });
    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).status).toBe(503);
    expect(await statusOf(key)).toEqual({ status: 'not_processed' });
    expect(balanceOf()).toBe(ANA_BALANCE);
  });

  it('timeout-unresolved: still in progress after the whole verification window', async () => {
    const key = crypto.randomUUID();
    const pending = postTransfer(POST, VALID_BODY, { key, outcome: 'timeout-unresolved' });
    await untilDelayed();
    // Client timeout (10 s) + checks at 2, 4 and 8 s = 24 s: still in progress at every check.
    await vi.advanceTimersByTimeAsync(24_000);
    expect(await statusOf(key)).toEqual({ status: 'in_progress' });
    // A retry with the same key meanwhile does not process it twice.
    expect((await postTransfer(POST, VALID_BODY, { key })).status).toBe(202);

    await vi.advanceTimersByTimeAsync(unresolvedMs - 24_000);
    expect((await pending).status).toBe(503);
    expect(await statusOf(key)).toEqual({ status: 'not_processed' });
    expect(balanceOf()).toBe(ANA_BALANCE);
  });
});

describe('[TC-INT-10][NFR-10] mock controls and random outcomes', () => {
  it('with mock controls off the header is ignored (and logged); weights decide', async () => {
    setupApiEnv({ MOCK_CONTROLS_ENABLED: 'false', OUTCOME_WEIGHTS: 'success:1' });
    const logs = captureLogs();
    const response = await postTransfer(POST, VALID_BODY, { outcome: 'network_error' });
    expect(response.status).toBe(201);
    expect(logs.some((l) => l.event === 'mock.outcome.ignored')).toBe(true);
  });

  it('without a header the outcome comes from OUTCOME_WEIGHTS', async () => {
    setupApiEnv({ OUTCOME_WEIGHTS: 'network_error:1' });
    const response = await postTransfer(POST, VALID_BODY, { outcome: null });
    expect(response.status).toBe(503);
  });

  it('logs carry no names, identifiers or concepts', async () => {
    setupApiEnv();
    const logs = captureLogs();
    await postTransfer(POST, {
      recipient: { name: 'Pedro Gómez', identifier: '5587654321' },
      amount: { amountMinor: 100, currency: 'MXN' },
      concept: 'Renta secreta',
    });
    const text = JSON.stringify(logs);
    expect(text).toContain('tx.confirm.completed');
    for (const secret of ['Pedro', '5587654321', 'Renta secreta', 'Tacos']) {
      expect(text).not.toContain(secret);
    }
  });
});
