import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AttemptKey, UserId } from '@/core/ids';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { getRepositories } from '@/server/repositories';
import { setupApiEnv, teardownApiEnv } from '@/test/api';
import { VALID_BODY } from '@/test/transfers';
import {
  createTransfersService,
  newFolio,
  payloadHash,
  simulatedDelays,
  type TransfersService,
} from './transfers.service';

let service: TransfersService;

beforeEach(() => {
  setupApiEnv();
  service = createTransfersService({
    repos: getRepositories(),
    outcomeWeights: () => ({
      success: 1,
      network_error: 0,
      insufficient_funds: 0,
      timeout: 0,
      unknown_error: 0,
    }),
  });
});
afterEach(() => teardownApiEnv());

const ana = SEED_USER_IDS.ana as UserId;
const key = () => crypto.randomUUID() as AttemptKey;

describe('[TC-INT-11][AC-CONF-17] receipt ownership', () => {
  it('the owner gets the receipt; anyone else gets NOT_FOUND, same as a missing one', async () => {
    const result = await service.confirm(ana, key(), VALID_BODY);
    if (result.kind !== 'completed') throw new Error(`expected completed, got ${result.kind}`);
    const { transferId } = result.receipt;

    expect(await service.getReceipt(ana, transferId)).toEqual({ ok: true, value: result.receipt });
    const foreign = await service.getReceipt(SEED_USER_IDS.nico as UserId, transferId);
    const missing = await service.getReceipt(ana, 'trf_does_not_exist');
    expect(foreign).toEqual({ ok: false, error: { code: 'NOT_FOUND' } });
    expect(missing).toEqual(foreign);
  });
});

describe('transfers service details', () => {
  it('[BR-07] payload hash: same data → same hash; any change → another; concept spaces ignored', () => {
    const base = payloadHash(VALID_BODY);
    expect(payloadHash({ ...VALID_BODY, concept: '  Tacos ' })).toBe(base);
    expect(payloadHash({ ...VALID_BODY, concept: 'Tortas' })).not.toBe(base);
    expect(
      payloadHash({ ...VALID_BODY, amount: { amountMinor: 25001, currency: 'MXN' } }),
    ).not.toBe(base);
    expect(payloadHash({ ...VALID_BODY, recipient: { contactId: 'ctc_ana_maria' } })).not.toBe(
      base,
    );
    expect(payloadHash({ ...VALID_BODY, concept: '' })).toBe(
      payloadHash({ ...VALID_BODY, concept: null }),
    );
  });

  it('folio: MW- plus six unambiguous characters, different each time', () => {
    const folios = new Set(Array.from({ length: 200 }, newFolio));
    expect(folios.size).toBe(200);
    for (const folio of folios) expect(folio).toMatch(/^MW-[A-HJKMNP-Z2-9]{6}$/);
  });

  it('simulated delays: late lands between the client timeout and its first check', () => {
    const delays = simulatedDelays({
      transferSlowMs: 3000,
      transferTimeoutMs: 10000,
      transferStatusCheckDelaysMs: [2000, 4000, 8000],
    });
    expect(delays).toEqual({ lateMs: 11000, unresolvedMs: 29000 });
  });

  it('a completed transfer moves the favorite to the top of the list (most recent use)', async () => {
    await service.confirm(ana, key(), { ...VALID_BODY, recipient: { contactId: 'ctc_ana_sofia' } });
    const contacts = await getRepositories().contacts.list(ana);
    expect(contacts[0]?.id).toBe('ctc_ana_sofia');
  });

  it('the new movement is first in the activity list, outgoing and completed', async () => {
    await service.confirm(ana, key(), VALID_BODY);
    const recent = await getRepositories().transactions.listRecent(ana, 1);
    expect(recent.ok && recent.value[0]).toMatchObject({
      direction: 'out',
      status: 'completed',
      amount: { amountMinor: 25000, currency: 'MXN' },
      counterparty: { name: 'Luis Pérez', maskedIdentifier: '•••• 5432' },
      concept: 'Tacos',
    });
  });
});
