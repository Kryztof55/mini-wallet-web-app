import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetConfigCache } from '@/lib/config';
import { getMockDb } from '@/server/mock/db';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { POST } from './route';

const reset = () => POST(new Request('http://localhost/api/mock/reset', { method: 'POST' }));

function withEnv(env: Record<string, string>) {
  vi.stubEnv('SESSION_SECRET', 'x'.repeat(32));
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  resetConfigCache();
}

afterEach(() => {
  vi.unstubAllEnvs();
  resetConfigCache();
});

describe('[TC-INT-12][NFR-10] mock controls', () => {
  it('restores seed data when mock controls are enabled', async () => {
    withEnv({ APP_ENV: 'test', MOCK_CONTROLS_ENABLED: 'true' });
    getMockDb().balances.set(SEED_USER_IDS.ana, { amountMinor: 1, currency: 'MXN' });

    const response = await reset();

    expect(response.status).toBe(204);
    expect(getMockDb().balances.get(SEED_USER_IDS.ana)?.amountMinor).toBe(1234567);
  });

  it.each([
    { APP_ENV: 'production', MOCK_CONTROLS_ENABLED: 'true' },
    { APP_ENV: 'development', MOCK_CONTROLS_ENABLED: 'false' },
  ])('does not exist when mock controls are off (%o)', async (env) => {
    withEnv(env);
    const response = await reset();
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});
