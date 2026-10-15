import { newRequestId, REQUEST_ID_HEADER } from './request-id';

export type ClientEventInput = {
  readonly event:
    | 'tx.confirm.timeout'
    | 'tx.confirm.unresolved'
    | 'client.render.error'
    | 'client.http.network_error';
  readonly level: 'warn' | 'error';
  /** Correlation ID of the request that failed, if any. */
  readonly requestId?: string;
  readonly attemptKey?: string;
  readonly details?: Readonly<Record<string, string | number | boolean | null>>;
};

const queue: Array<ClientEventInput & { route: string; at: string }> = [];
let scheduled = false;

function flush(): void {
  scheduled = false;
  const events = queue.splice(0, 10);
  if (events.length === 0) return;
  // keepalive lets the report survive navigation; failures are ignored on purpose (no retry storms).
  void fetch('/api/client-logs', {
    method: 'POST',
    keepalive: true,
    headers: { 'content-type': 'application/json', [REQUEST_ID_HEADER]: newRequestId() },
    body: JSON.stringify({ events }),
  }).catch(() => undefined);
  if (queue.length > 0) schedule();
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  setTimeout(flush, 0);
}

/** Reports a client-side failure to the server log (TS-05). Fire-and-forget. */
export function reportClientEvent(input: ClientEventInput): void {
  queue.push({ ...input, route: window.location.pathname, at: new Date().toISOString() });
  schedule();
}
