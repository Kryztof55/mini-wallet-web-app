import { z } from 'zod';

/**
 * Server configuration (TS-00 §8). Validated once; invalid configuration fails fast.
 * Mock controls are effective only outside production, whatever the flag says.
 */
const OUTCOME_KEYS = [
  'success',
  'network_error',
  'insufficient_funds',
  'timeout',
  'unknown_error',
] as const;
export type OutcomeKey = (typeof OUTCOME_KEYS)[number];
export type OutcomeWeights = Readonly<Record<OutcomeKey, number>>;

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');
const positiveInt = z.coerce.number().int().positive();

const weightsString = z.string().transform((value, ctx): OutcomeWeights => {
  const entries = value.split(',').map((pair) => pair.split(':').map((part) => part.trim()));
  const weights: Record<string, number> = {};
  for (const [key, raw] of entries) {
    const weight = Number(raw);
    if (
      !key ||
      !(OUTCOME_KEYS as readonly string[]).includes(key) ||
      !Number.isFinite(weight) ||
      weight < 0
    ) {
      ctx.addIssue({ code: 'custom', message: `Invalid outcome weight "${key}:${raw}"` });
      return z.NEVER;
    }
    weights[key] = weight;
  }
  const complete = Object.fromEntries(
    OUTCOME_KEYS.map((key) => [key, weights[key] ?? 0]),
  ) as Record<OutcomeKey, number>;
  if (Object.values(complete).reduce((sum, w) => sum + w, 0) <= 0) {
    ctx.addIssue({ code: 'custom', message: 'Outcome weights must add up to more than 0' });
    return z.NEVER;
  }
  return complete;
});

const latencyString = z.string().transform((value, ctx) => {
  const match = /^(\d+)-(\d+)$/.exec(value.trim());
  const min = Number(match?.[1]);
  const max = Number(match?.[2]);
  if (!match || min > max) {
    ctx.addIssue({ code: 'custom', message: `Invalid latency range "${value}"` });
    return z.NEVER;
  }
  return { minMs: min, maxMs: max };
});

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).optional(),
  NODE_ENV: z.string().optional(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  APP_ORIGIN: z.url().default('http://localhost:3000'),
  MOCK_CONTROLS_ENABLED: booleanString.default(true),
  OTP_TTL_SEC: positiveInt.default(300),
  OTP_MAX_ATTEMPTS: positiveInt.default(3),
  OTP_RESEND_COOLDOWN_SEC: positiveInt.default(30),
  OUTCOME_WEIGHTS: weightsString.default({
    success: 60,
    network_error: 10,
    insufficient_funds: 10,
    timeout: 10,
    unknown_error: 10,
  }),
  MOCK_LATENCY_MS: latencyString.default({ minMs: 300, maxMs: 900 }),
  ACTIVITY_LIMIT: positiveInt.default(10),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type AppEnv = 'development' | 'test' | 'production';

export type ServerConfig = {
  readonly appEnv: AppEnv;
  readonly sessionSecret: string;
  readonly appOrigin: string;
  /** Effective value: always false when appEnv is production (TS-00 §8). */
  readonly mockControlsEnabled: boolean;
  readonly otp: {
    readonly ttlSec: number;
    readonly maxAttempts: number;
    readonly resendCooldownSec: number;
  };
  readonly outcomeWeights: OutcomeWeights;
  readonly mockLatency: { readonly minMs: number; readonly maxMs: number };
  readonly activityLimit: number;
  readonly logLevel: string;
};

export function loadConfig(env: Record<string, string | undefined>): ServerConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid server configuration:\n- ${problems.join('\n- ')}`);
  }
  const e = parsed.data;
  const appEnv: AppEnv = e.APP_ENV ?? (e.NODE_ENV === 'production' ? 'production' : 'development');
  return {
    appEnv,
    sessionSecret: e.SESSION_SECRET,
    appOrigin: new URL(e.APP_ORIGIN).origin,
    mockControlsEnabled: appEnv !== 'production' && e.MOCK_CONTROLS_ENABLED,
    otp: {
      ttlSec: e.OTP_TTL_SEC,
      maxAttempts: e.OTP_MAX_ATTEMPTS,
      resendCooldownSec: e.OTP_RESEND_COOLDOWN_SEC,
    },
    outcomeWeights: e.OUTCOME_WEIGHTS,
    mockLatency: e.MOCK_LATENCY_MS,
    activityLimit: e.ACTIVITY_LIMIT,
    logLevel: e.LOG_LEVEL,
  };
}

let cached: ServerConfig | undefined;

/** Lazily loaded from `process.env`; call `resetConfigCache()` in tests after changing env. */
export function getConfig(): ServerConfig {
  cached ??= loadConfig(process.env);
  return cached;
}

export function resetConfigCache(): void {
  cached = undefined;
}
