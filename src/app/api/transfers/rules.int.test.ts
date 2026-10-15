import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { setupApiEnv, teardownApiEnv } from '@/test/api';
import { balanceOf, outgoingCount, postTransfer, VALID_BODY } from '@/test/transfers';
import { POST } from './route';

beforeEach(() => setupApiEnv());
afterEach(() => teardownApiEnv());

const ANA_BALANCE = 1234567;

async function expectRejected(body: unknown, code: string, userId?: string) {
  const before = { balance: balanceOf(userId), count: outgoingCount(userId) };
  const response = await postTransfer(POST, body, userId ? { userId } : {});
  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({ code });
  // No debit and no movement on any failure.
  expect(balanceOf(userId)).toBe(before.balance);
  expect(outgoingCount(userId)).toBe(before.count);
}

describe('[TC-INT-08][BR-06][AC-TX-15] POST /api/transfers — every rule re-checked on the server', () => {
  it('a valid transfer completes: 201 with the receipt, balance debited once', async () => {
    const response = await postTransfer(POST);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      transferId: expect.stringMatching(/^trf_/),
      folio: expect.stringMatching(/^MW-[A-HJ-NP-Z2-9]{6}$/),
      amount: { amountMinor: 25000, currency: 'MXN' },
      recipient: { name: 'Luis Pérez', maskedIdentifier: '•••• 5432' },
      concept: 'Tacos',
      completedAt: expect.any(String),
      balanceAfter: { amountMinor: ANA_BALANCE - 25000, currency: 'MXN' },
    });
    expect(balanceOf()).toBe(ANA_BALANCE - 25000);
  });

  it('[BR-01] zero amount → INVALID_AMOUNT', async () => {
    await expectRejected(
      { ...VALID_BODY, amount: { amountMinor: 0, currency: 'MXN' } },
      'INVALID_AMOUNT',
    );
  });

  it.each([
    ['fractional minor units', { amountMinor: 12.5, currency: 'MXN' }],
    ['negative', { amountMinor: -100, currency: 'MXN' }],
    ['unsafe integer', { amountMinor: Number.MAX_SAFE_INTEGER + 1, currency: 'MXN' }],
    ['another currency', { amountMinor: 100, currency: 'USD' }],
  ])('[BR-04] %s → INVALID_AMOUNT', async (_label, amount) => {
    await expectRejected({ ...VALID_BODY, amount }, 'INVALID_AMOUNT');
  });

  it('[BR-02] more than the balance → INSUFFICIENT_FUNDS with the current balance', async () => {
    const response = await postTransfer(POST, {
      ...VALID_BODY,
      amount: { amountMinor: ANA_BALANCE + 1, currency: 'MXN' },
    });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      code: 'INSUFFICIENT_FUNDS',
      details: { balanceMinor: ANA_BALANCE },
    });
    expect(balanceOf()).toBe(ANA_BALANCE);
  });

  it('[BR-02] a genuinely insufficient balance wins over a forced network error', async () => {
    const response = await postTransfer(
      POST,
      { recipient: { contactId: 'ctc_carla_luis' }, amount: { amountMinor: 1, currency: 'MXN' } },
      { userId: SEED_USER_IDS.carla, outcome: 'network_error' },
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: 'INSUFFICIENT_FUNDS' });
  });

  it("[BR-03] another user's contact → RECIPIENT_REQUIRED, same as a missing one", async () => {
    await expectRejected(
      { ...VALID_BODY, recipient: { contactId: 'ctc_carla_luis' } },
      'RECIPIENT_REQUIRED',
    );
    await expectRejected(
      { ...VALID_BODY, recipient: { contactId: 'ctc_nope' } },
      'RECIPIENT_REQUIRED',
    );
  });

  it('[BR-05][BR-10] one-off recipient with an invalid identifier → INVALID_IDENTIFIER', async () => {
    await expectRejected(
      { ...VALID_BODY, recipient: { name: 'Pedro', identifier: '12345' } },
      'INVALID_IDENTIFIER',
    );
    await expectRejected(
      { ...VALID_BODY, recipient: { name: 'Pedro', identifier: '  ' } },
      'INVALID_IDENTIFIER',
    );
  });

  it('[BR-16] one-off recipient without a name → INVALID_CONTACT_NAME', async () => {
    await expectRejected(
      { ...VALID_BODY, recipient: { name: ' ', identifier: '5587654321' } },
      'INVALID_CONTACT_NAME',
    );
  });

  it('[BR-09] to one of my own identifiers, in any format → SELF_TRANSFER', async () => {
    await expectRejected(
      { ...VALID_BODY, recipient: { name: 'Yo', identifier: '55 1234 5678' } },
      'SELF_TRANSFER',
    );
    await expectRejected(
      { ...VALID_BODY, recipient: { name: 'Yo', identifier: 'ANA@demo.mx' } },
      'SELF_TRANSFER',
    );
  });

  it('[BR-15] concept over 40 characters or with line breaks → INVALID_CONCEPT', async () => {
    await expectRejected({ ...VALID_BODY, concept: 'x'.repeat(41) }, 'INVALID_CONCEPT');
    await expectRejected({ ...VALID_BODY, concept: 'Tacos\nal pastor' }, 'INVALID_CONCEPT');
  });

  it('one-off recipient that passes every rule completes without saving a contact', async () => {
    const response = await postTransfer(POST, {
      recipient: { name: 'Pedro Gómez', identifier: '55 8765 4321' },
      amount: { amountMinor: 100, currency: 'MXN' },
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      recipient: { name: 'Pedro Gómez', maskedIdentifier: '•••• 4321' },
      concept: null,
    });
  });

  it('malformed body or missing key → 400 VALIDATION_ERROR before any rule', async () => {
    const extra = await postTransfer(POST, { ...VALID_BODY, admin: true });
    expect(extra.status).toBe(400);
    const noKey = await postTransfer(POST, VALID_BODY, { key: 'not-a-uuid' });
    expect(noKey.status).toBe(400);
    expect(await noKey.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { field: 'idempotency-key' },
    });
    expect(balanceOf()).toBe(ANA_BALANCE);
  });
});
