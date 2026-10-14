import { afterEach, describe, expect, it } from 'vitest';
import { POST as requestCode } from '@/app/api/auth/code/route';
import { POST as reset } from '@/app/api/mock/reset/route';
import { setLogger } from '@/server/logging/logger';
import { captureLogs } from '@/test/capture-logs';
import { jsonPost, setupApiEnv, teardownApiEnv } from '@/test/api';

afterEach(() => {
  setLogger(undefined);
  teardownApiEnv();
});

describe('[TC-INT-12][NFR-10] mock controls disabled', () => {
  it.each([
    { APP_ENV: 'production', MOCK_CONTROLS_ENABLED: 'true' },
    { APP_ENV: 'development', MOCK_CONTROLS_ENABLED: 'false' },
  ])('ignores x-mock-outcome (logged), hides the demo code and hides reset — %o', async (env) => {
    setupApiEnv(env);
    const logs = captureLogs();

    const response = await requestCode(
      jsonPost(
        '/api/auth/code',
        { identifier: '5512345678' },
        { 'x-mock-outcome': 'service_unavailable' },
      ),
    );
    expect(response.status).toBe(202);
    expect(await response.json()).not.toHaveProperty('demoCode');
    expect(logs).toContainEqual(
      expect.objectContaining({ event: 'mock.outcome.ignored', level: 'warn' }),
    );

    expect((await reset(jsonPost('/api/mock/reset', {}))).status).toBe(404);
  });

  it('with mock controls on, the forced outcome is applied and logged', async () => {
    setupApiEnv();
    const logs = captureLogs();
    const response = await requestCode(
      jsonPost(
        '/api/auth/code',
        { identifier: '5512345678' },
        { 'x-mock-outcome': 'service_unavailable' },
      ),
    );
    expect(response.status).toBe(503);
    expect(logs).toContainEqual(
      expect.objectContaining({ event: 'mock.outcome.forced', outcome: 'service_unavailable' }),
    );
  });
});
