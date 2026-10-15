import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

const SECRET = 'x'.repeat(32);

describe('[TC-UNIT-21][NFR-10] server configuration', () => {
  it('applies the defaults from ASM-15…ASM-17', () => {
    const config = loadConfig({ SESSION_SECRET: SECRET });
    expect(config).toMatchObject({
      appEnv: 'development',
      appOrigin: 'http://localhost:3000',
      mockControlsEnabled: true,
      otp: { ttlSec: 300, maxAttempts: 3, resendCooldownSec: 30 },
      outcomeWeights: {
        success: 60,
        network_error: 10,
        insufficient_funds: 10,
        timeout: 10,
        unknown_error: 10,
      },
      mockLatency: { minMs: 300, maxMs: 900 },
      activityLimit: 10,
    });
  });

  it('fails fast without a session secret, or with a short one', () => {
    expect(() => loadConfig({})).toThrow(/SESSION_SECRET/);
    expect(() => loadConfig({ SESSION_SECRET: 'short' })).toThrow(/at least 32/);
  });

  it('always turns mock controls off in production, whatever the flag says', () => {
    expect(
      loadConfig({ SESSION_SECRET: SECRET, APP_ENV: 'production', MOCK_CONTROLS_ENABLED: 'true' })
        .mockControlsEnabled,
    ).toBe(false);
    expect(
      loadConfig({ SESSION_SECRET: SECRET, NODE_ENV: 'production', MOCK_CONTROLS_ENABLED: 'true' }),
    ).toMatchObject({
      appEnv: 'production',
      mockControlsEnabled: false,
    });
  });

  it('lets a production build run with mock controls when APP_ENV=test (E2E)', () => {
    expect(
      loadConfig({ SESSION_SECRET: SECRET, NODE_ENV: 'production', APP_ENV: 'test' })
        .mockControlsEnabled,
    ).toBe(true);
  });

  it('parses weights, latency and numbers', () => {
    const config = loadConfig({
      SESSION_SECRET: SECRET,
      OUTCOME_WEIGHTS: 'success:1,timeout:3',
      MOCK_LATENCY_MS: '0-50',
      OTP_TTL_SEC: '60',
      APP_ORIGIN: 'http://localhost:3100/',
    });
    expect(config.outcomeWeights).toEqual({
      success: 1,
      network_error: 0,
      insufficient_funds: 0,
      timeout: 3,
      unknown_error: 0,
    });
    expect(config.mockLatency).toEqual({ minMs: 0, maxMs: 50 });
    expect(config.otp.ttlSec).toBe(60);
    expect(config.appOrigin).toBe('http://localhost:3100');
  });

  it.each([
    ['OUTCOME_WEIGHTS', 'success:abc'],
    ['OUTCOME_WEIGHTS', 'bogus:10'],
    ['OUTCOME_WEIGHTS', 'success:0'],
    ['MOCK_LATENCY_MS', '900-300'],
    ['OTP_MAX_ATTEMPTS', '0'],
    ['APP_ENV', 'staging'],
  ])('rejects invalid %s=%s', (key, value) => {
    expect(() => loadConfig({ SESSION_SECRET: SECRET, [key]: value })).toThrow(
      /Invalid server configuration/,
    );
  });
});
