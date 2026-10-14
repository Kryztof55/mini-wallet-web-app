/** Closed catalog of log events (TS-05 §11.3). Only these names compile. */
export const LOG_EVENTS = [
  'app.started',
  'http.request.completed',
  'auth.code.requested',
  'auth.code.rejected',
  'auth.code.throttled',
  'auth.code.request_failed',
  'auth.verify.rejected',
  'auth.verify.succeeded',
  'auth.verify.failed',
  'auth.verify.locked',
  'auth.verify.request_failed',
  'auth.logout',
  'auth.session.rejected',
  'security.csrf.rejected',
  'home.summary.loaded',
  'home.summary.failed',
  'home.activity.loaded',
  'home.activity.failed',
  'tx.contacts.loaded',
  'tx.contacts.failed',
  'tx.contact.created',
  'tx.contact.duplicate',
  'tx.contact.rejected',
  'tx.contact.save_failed',
  'tx.confirm.requested',
  'tx.confirm.completed',
  'tx.confirm.failed',
  'tx.confirm.rejected',
  'tx.confirm.network_unavailable',
  'tx.confirm.error',
  'tx.confirm.replayed',
  'tx.confirm.idempotency_conflict',
  'tx.status.checked',
  'tx.confirm.timeout',
  'tx.confirm.unresolved',
  'receipt.viewed',
  'receipt.not_found',
  'mock.outcome.forced',
  'mock.outcome.ignored',
  'mock.reset',
  'prefs.theme.changed',
  'client.render.error',
  'client.http.network_error',
] as const;

export type LogEvent = (typeof LOG_EVENTS)[number];

/** Events the browser may report through `POST /api/client-logs`. */
export const CLIENT_LOG_EVENTS = [
  'tx.confirm.timeout',
  'tx.confirm.unresolved',
  'client.render.error',
  'client.http.network_error',
] as const satisfies readonly LogEvent[];

export type ClientLogEvent = (typeof CLIENT_LOG_EVENTS)[number];
