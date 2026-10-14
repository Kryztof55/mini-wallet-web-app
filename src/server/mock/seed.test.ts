import { describe, expect, it } from 'vitest';
import { parseIdentifier } from '@/core/identifier';
import { createInMemoryRepositories } from '@/server/repositories/in-memory';
import { createMockDb } from './db';
import { SEED_USER_IDS } from './seed';

const repos = () =>
  createInMemoryRepositories(createMockDb(new Date('2026-10-14T18:00:00Z')), () =>
    Promise.resolve(),
  );
const find = async (raw: string) => {
  const parsed = parseIdentifier(raw);
  if (!parsed.ok) throw new Error(raw);
  return repos().users.findByIdentifier(parsed.value);
};

describe('[TS-00 §9.1] seed data demonstrates every state', () => {
  it('finds seeded users by phone or email', async () => {
    expect((await find('55 1234 5678'))?.id).toBe(SEED_USER_IDS.ana);
    expect((await find('ANA@demo.mx'))?.id).toBe(SEED_USER_IDS.ana);
    expect(await find('5599999999')).toBeNull();
  });

  it('gives Ana more than 10 transactions, newest first, with pending and failed ones', async () => {
    const result = await repos().transactions.listRecent(SEED_USER_IDS.ana, 100);
    if (!result.ok) throw new Error('expected transactions');
    const list = result.value;
    expect(list.length).toBe(25);
    expect([...list].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))).toEqual(list);
    expect(list.some((t) => t.status === 'pending')).toBe(true);
    expect(list.some((t) => t.status === 'failed')).toBe(true);
  });

  it('covers empty, zero-balance and failing users', async () => {
    const db = createMockDb();
    expect(db.transactions.get(SEED_USER_IDS.nico)).toEqual([]);
    expect(db.balances.get(SEED_USER_IDS.carla)?.amountMinor).toBe(0);
    expect(db.behaviors.get(SEED_USER_IDS.beto)).toEqual({ summaryFails: true });
    expect(db.behaviors.get(SEED_USER_IDS.marta)).toEqual({ activityFails: true });
    expect(db.behaviors.get(SEED_USER_IDS.fallaLogin)).toEqual({ codeRequestFails: true });
  });
});
