import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getMockDb } from '@/server/mock/db';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { setLogger } from '@/server/logging/logger';
import { captureLogs } from '@/test/capture-logs';
import { jsonGet, jsonPost, sessionCookieFor, setupApiEnv, teardownApiEnv } from '@/test/api';
import { GET, POST } from './route';

beforeEach(() => setupApiEnv());
afterEach(() => {
  setLogger(undefined);
  teardownApiEnv();
});

async function list(userId: string, headers: Record<string, string> = {}) {
  return GET(jsonGet('/api/contacts', { cookie: await sessionCookieFor(userId), ...headers }));
}

async function save(
  body: unknown,
  userId: string = SEED_USER_IDS.ana,
  headers: Record<string, string> = {},
) {
  return POST(
    jsonPost('/api/contacts', body, { cookie: await sessionCookieFor(userId), ...headers }),
  );
}

describe('[TC-INT-07][BR-08][BR-09][BR-10][BR-16][FR-TX-02][FR-TX-04] Contacts endpoints', () => {
  it('GET returns favorites by most recent use, then name, with masked identifiers only', async () => {
    const response = await list(SEED_USER_IDS.ana);
    expect(response.status).toBe(200);
    const { items } = (await response.json()) as { items: Record<string, unknown>[] };
    expect(items.map((c) => c.name)).toEqual([
      'Luis Pérez',
      'María Torres',
      'Jorge Ramírez',
      'Sofía Díaz',
    ]);
    expect(items[0]).toEqual({
      id: expect.any(String),
      name: 'Luis Pérez',
      maskedIdentifier: '•••• 5432',
      lastUsedAt: expect.any(String),
    });
    expect(items.at(-1)?.lastUsedAt).toBeNull();
    expect(JSON.stringify(items)).not.toContain('5598765432');
  });

  it('GET returns an empty list for a user without favorites', async () => {
    expect(await (await list(SEED_USER_IDS.nico)).json()).toEqual({ items: [] });
  });

  it('POST 201 creates a favorite (identifier normalized, name trimmed)', async () => {
    const response = await save({ name: '  Pedro Gómez ', identifier: '+52 (55) 4444-3333' });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      created: true,
      contact: {
        id: expect.any(String),
        name: 'Pedro Gómez',
        maskedIdentifier: '•••• 3333',
        lastUsedAt: null,
      },
    });
  });

  it('POST 200 returns the existing favorite for a duplicate identifier in any format (BR-08)', async () => {
    const response = await save({ name: 'Otro nombre', identifier: '55 9876 5432' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      created: false,
      contact: { name: 'Luis Pérez' },
    });
    expect(getMockDb().contacts.get(SEED_USER_IDS.ana)).toHaveLength(4);
  });

  it.each([
    [{ name: '', identifier: '5544443333' }, 'INVALID_CONTACT_NAME'],
    [{ name: 'x'.repeat(51), identifier: '5544443333' }, 'INVALID_CONTACT_NAME'],
    [{ name: 'Pedro', identifier: '55123' }, 'INVALID_IDENTIFIER'],
    [{ name: 'Yo', identifier: 'ANA@demo.mx' }, 'SELF_TRANSFER'],
    [{ name: 'Yo', identifier: '+52 55 1234 5678' }, 'SELF_TRANSFER'],
  ])('POST %o → 422 %s', async (body, code) => {
    const response = await save(body);
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code });
  });

  it('400 for a malformed body', async () => {
    expect((await save({ name: 'Pedro' })).status).toBe(400);
  });

  it('forced 503 on list and on save; nothing saved', async () => {
    const forced = { 'x-mock-outcome': 'service_unavailable' };
    expect((await list(SEED_USER_IDS.ana, forced)).status).toBe(503);
    const response = await save(
      { name: 'Pedro', identifier: '5544443333' },
      SEED_USER_IDS.ana,
      forced,
    );
    expect(response.status).toBe(503);
    expect(getMockDb().contacts.get(SEED_USER_IDS.ana)).toHaveLength(4);
  });

  it('401 without a session', async () => {
    expect((await GET(jsonGet('/api/contacts'))).status).toBe(401);
    expect((await POST(jsonPost('/api/contacts', { name: 'a', identifier: 'b' }))).status).toBe(
      401,
    );
  });

  it('never logs names or identifiers', async () => {
    const logs = captureLogs();
    await save({ name: 'Pedro Gómez', identifier: '5544443333' });
    const all = JSON.stringify(logs);
    expect(logs.some((line) => line.event === 'tx.contact.created')).toBe(true);
    expect(all).not.toContain('Pedro');
    expect(all).not.toContain('5544443333');
  });
});
