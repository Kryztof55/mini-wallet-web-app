'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { reportClientEvent, type ClientEventInput } from '@/lib/observability/report-client-event';
import { publicConfig } from '@/lib/public-config';
import { transfersApi as defaultApi, type TransferBody, type TransfersApi } from './api';
import {
  confirmReducer,
  initialConfirmState,
  nextFromConfirm,
  stateFromStatus,
  type ConfirmState,
} from './confirm-state';

export type ConfirmTimings = {
  readonly transferSlowMs: number;
  readonly transferTimeoutMs: number;
  readonly transferStatusCheckDelaysMs: readonly number[];
};

export type ConfirmRequest = { readonly body: TransferBody; readonly attemptKey: string };

type Run = {
  readonly controller: AbortController;
  readonly timers: Set<ReturnType<typeof setTimeout>>;
};

/** Resolves after `ms`, or as soon as the run is cancelled (so nothing waits forever). */
function wait(run: Run, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      run.timers.delete(timer);
      resolve();
    }, ms);
    run.timers.add(timer);
    run.controller.signal.addEventListener('abort', () => resolve(), { once: true });
  });
}

/**
 * Confirmation state machine (TS-04 §8): one request per attempt key, "slow" message at 3 s,
 * client timeout at 10 s, then status checks at +2/+4/+8 s, never more. Every timer and
 * request is cancelled on unmount, and nothing is retried automatically (UIR-CONF-16).
 * Retrying uses the same key, so it can never send twice (BR-07).
 */
export function useConfirmTransfer({
  api = defaultApi,
  timings = publicConfig,
  report = reportClientEvent,
}: {
  readonly api?: TransfersApi;
  readonly timings?: ConfirmTimings;
  readonly report?: (event: ClientEventInput) => void;
} = {}) {
  const [state, dispatch] = useReducer(confirmReducer, initialConfirmState);
  const current = useRef<Run | null>(null);

  const cancel = useCallback(() => {
    const run = current.current;
    if (!run) return;
    current.current = null;
    run.controller.abort();
    for (const timer of run.timers) clearTimeout(timer);
    run.timers.clear();
  }, []);

  useEffect(() => cancel, [cancel]);

  const verify = useCallback(
    async (run: Run, attemptKey: string, ref: string, immediately: boolean) => {
      const delays = timings.transferStatusCheckDelaysMs;
      for (let index = 0; index < delays.length; index += 1) {
        dispatch({ type: 'verifying', checksDone: index });
        await wait(run, immediately && index === 0 ? 0 : (delays[index] ?? 0));
        if (run.controller.signal.aborted) return;
        const result = await api.status(attemptKey, {
          requestId: ref,
          signal: run.controller.signal,
        });
        if (run.controller.signal.aborted) return;
        // A failed check counts as a check (EC-04); "in progress" keeps checking.
        const settled = result.ok ? stateFromStatus(result.value.data, ref) : null;
        if (settled) {
          dispatch({ type: 'settled', state: settled });
          return;
        }
      }
      dispatch({ type: 'settled', state: { status: 'unresolved', ref } });
      report({
        event: 'tx.confirm.unresolved',
        level: 'error',
        requestId: ref,
        attemptKey,
        details: { checks: delays.length },
      });
    },
    [api, report, timings],
  );

  /** "Enviar $X" and "Intentar de nuevo". Ignored while an attempt is running (UIR-CONF-01). */
  const confirm = useCallback(
    async ({ body, attemptKey }: ConfirmRequest) => {
      if (current.current) return;
      const run: Run = { controller: new AbortController(), timers: new Set() };
      current.current = run;
      dispatch({ type: 'started' });

      const slow = setTimeout(() => dispatch({ type: 'slow' }), timings.transferSlowMs);
      run.timers.add(slow);
      const result = await api.confirm(body, attemptKey, {
        timeoutMs: timings.transferTimeoutMs,
        signal: run.controller.signal,
      });
      clearTimeout(slow);
      run.timers.delete(slow);
      if (run.controller.signal.aborted) return;

      const next = nextFromConfirm(
        result.ok
          ? { ok: true, status: result.value.status, data: result.value.data }
          : { ok: false, error: result.error },
      );
      if (next.kind === 'settled') dispatch({ type: 'settled', state: next.state });
      if (next.kind === 'verify') {
        const ref = result.ok ? result.value.requestId : result.error.requestId;
        if (!result.ok) {
          report({ event: 'tx.confirm.timeout', level: 'warn', requestId: ref, attemptKey });
        }
        await verify(run, attemptKey, ref, next.immediately);
      }
      if (current.current === run) current.current = null;
    },
    [api, report, timings, verify],
  );

  /** "Cambiar datos": back to the summary (only from an outcome, never mid-request). */
  const reset = useCallback(() => {
    if (current.current) return;
    dispatch({ type: 'reset' });
  }, []);

  return { state, confirm, reset } as const satisfies {
    state: ConfirmState;
    confirm: (request: ConfirmRequest) => Promise<void>;
    reset: () => void;
  };
}
