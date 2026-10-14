import { describe, expect, it } from 'vitest';
import { parseIdentifier, type Identifier } from '@/core/identifier';
import { createMockDb } from '@/server/mock/db';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { createInMemoryRepositories } from './in-memory';

const noLatency = () => Promise.resolve();
const id = (raw: string): Identifier => {
  const parsed = parseIdentifier(raw);
  if (!parsed.ok) throw new Error(raw);
  return parsed.value;
};

describe('[TC-UNIT-22][BR-08] contact repository uniqueness', () => {
  it('returns the existing favorite for the same normalized identifier (FS-03 EC-08)', async () => {
    const repos = createInMemoryRepositories(createMockDb(), noLatency);
    const { ana } = SEED_USER_IDS;

    const first = await repos.contacts.save(ana, 'Pedro Gómez', id('55 7777 8888'));
    const again = await repos.contacts.save(ana, 'Otro nombre', id('+52 (55) 7777-8888'));

    expect(first.created).toBe(true);
    expect(again).toEqual({ contact: first.contact, created: false });
    expect(
      (await repos.contacts.list(ana)).filter((c) => c.identifier.value === '5577778888'),
    ).toHaveLength(1);
  });

  it('detects seeded favorites as duplicates too', async () => {
    const repos = createInMemoryRepositories(createMockDb(), noLatency);
    const result = await repos.contacts.save(SEED_USER_IDS.ana, 'Luis', id('5598765432'));
    expect(result).toMatchObject({ created: false, contact: { name: 'Luis Pérez' } });
  });

  it('orders favorites by most recent use, never-used last (UIR-TX-03)', async () => {
    const repos = createInMemoryRepositories(createMockDb(), noLatency);
    const names = (await repos.contacts.list(SEED_USER_IDS.ana)).map((c) => c.name);
    expect(names).toEqual(['Luis Pérez', 'María Torres', 'Jorge Ramírez', 'Sofía Díaz']);
  });
});
