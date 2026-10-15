import 'server-only';
import pino, { type DestinationStream, type Logger } from 'pino';
import { getRequestContext } from './context';
import type { LogEvent } from './events';
import { REDACTED, REDACT_PATHS } from './redaction';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFields = Readonly<Record<string, unknown>>;

export function createLogger(
  options: { level?: string; destination?: DestinationStream } = {},
): Logger {
  return pino(
    {
      level: options.level ?? process.env.LOG_LEVEL ?? 'info',
      base: { service: 'mini-wallet' },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: { paths: [...REDACT_PATHS], censor: REDACTED },
      formatters: { level: (label) => ({ level: label }) },
    },
    options.destination,
  );
}

let instance: Logger | undefined;

export function getLogger(): Logger {
  instance ??= createLogger();
  return instance;
}

/** Replaces the process logger (tests). */
export function setLogger(logger: Logger | undefined): void {
  instance = logger;
}

/** Logs a catalog event with the request's correlation ID and user ID attached (TS-05 §11.1). */
export function logEvent(level: LogLevel, event: LogEvent, fields: LogFields = {}): void {
  const context = getRequestContext();
  getLogger()[level]({
    event,
    ...(context ? { requestId: context.requestId } : {}),
    ...(context?.userId ? { userId: context.userId } : {}),
    ...fields,
  });
}
