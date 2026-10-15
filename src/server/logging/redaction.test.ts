import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { runWithRequestContext, setContextUserId } from './context';
import { createLogger, logEvent, setLogger } from './logger';
import { REDACTED } from './redaction';

function capture() {
  const lines: Record<string, unknown>[] = [];
  const destination = new Writable({
    write(chunk, _encoding, done) {
      lines.push(JSON.parse(String(chunk)) as Record<string, unknown>);
      done();
    },
  });
  return { lines, logger: createLogger({ level: 'debug', destination }) };
}

describe('[TC-UNIT-20][NFR-05] log redaction', () => {
  it('never writes one-time codes, identifiers, names, destinations, session IDs or credentials', () => {
    const { lines, logger } = capture();
    logger.info({
      event: 'auth.verify.failed',
      code: '123456',
      otpCode: '123456',
      identifier: '5512345678',
      name: 'Ana López',
      destination: '•••• 5678',
      sessionId: 'abc',
      cookie: 'session=abc',
      authorization: 'Bearer x',
      req: { headers: { cookie: 'session=abc', authorization: 'Bearer x' } },
      recipient: { name: 'Luis', identifier: '5598765432' },
      errorCode: 'CODE_INCORRECT',
    });

    const line = lines[0] ?? {};
    const serialized = JSON.stringify(line);
    for (const secret of [
      '123456',
      '5512345678',
      'Ana López',
      'session=abc',
      'Bearer x',
      '5598765432',
      'Luis',
    ]) {
      expect(serialized).not.toContain(secret);
    }
    expect(line).toMatchObject({
      code: REDACTED,
      identifier: REDACTED,
      errorCode: 'CODE_INCORRECT',
    });
  });

  it('attaches requestId and userId from the request context', () => {
    const { lines, logger } = capture();
    setLogger(logger);
    try {
      runWithRequestContext({ requestId: 'req-1' }, () => {
        setContextUserId('usr_ana');
        logEvent('info', 'auth.logout');
      });
    } finally {
      setLogger(undefined);
    }
    expect(lines[0]).toMatchObject({
      event: 'auth.logout',
      requestId: 'req-1',
      userId: 'usr_ana',
      level: 'info',
    });
  });
});
