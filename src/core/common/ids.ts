import type { Brand } from './brand';

export type UserId = Brand<string, 'UserId'>;
export type ContactId = Brand<string, 'ContactId'>;
export type TransactionId = Brand<string, 'TransactionId'>;
export type TransferId = Brand<string, 'TransferId'>;
export type SessionId = Brand<string, 'SessionId'>;
/** Idempotency key of a transfer attempt (BR-07). */
export type AttemptKey = Brand<string, 'AttemptKey'>;
