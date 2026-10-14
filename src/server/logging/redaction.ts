/**
 * Paths removed from every log line (TS-05 §10). Values are replaced, never logged.
 * Error codes are logged as `errorCode`, so `code` here only ever means a one-time code.
 */
export const REDACT_PATHS = [
  'cookie',
  'authorization',
  'identifier',
  'code',
  'otpCode',
  'name',
  'destination',
  'sessionId',
  'req.headers.cookie',
  'req.headers.authorization',
  '*.cookie',
  '*.authorization',
  '*.identifier',
  '*.code',
  '*.otpCode',
  '*.name',
  '*.destination',
  '*.sessionId',
] as const;

export const REDACTED = '[REDACTED]';
