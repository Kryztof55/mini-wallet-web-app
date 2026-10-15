import { Writable } from 'node:stream';
import { createLogger, setLogger } from '@/server/logging/logger';

export type LogLine = Record<string, unknown>;

/** Routes the server logger to memory for the current test. Call `setLogger(undefined)` after. */
export function captureLogs(): LogLine[] {
  const lines: LogLine[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _encoding, done) {
      lines.push(JSON.parse(chunk.toString()) as LogLine);
      done();
    },
  });
  setLogger(createLogger({ level: 'debug', destination }));
  return lines;
}
