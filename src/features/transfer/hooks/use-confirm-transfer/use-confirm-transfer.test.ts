import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok, type Result } from '@/core/common';
import type { ClientError, ClientSuccess } from '@/shared/lib/http/client';
import type { AttemptStatus, ReceiptView, TransfersApi } from '@/shared/api/transfers';
import { useConfirmTransfer, type ConfirmRequest } from './use-confirm-transfer';

const TIMINGS = {
  transferSlowMs: 3000,
  transferTimeoutMs: 10000,
  transferStatusCheckDelaysMs: [2000, 4000, 8000],
};
const REQUEST: ConfirmRequest = {
  attemptKey: '11111111-1111-4111-8111-111111111111',
  body: {
    recipient: { contactId: 'ctc_ana_luis' },
    amount: { amountMinor: 25000, currency: 'MXN' },
    concept: 'Tacos',
  },
};
const REF = 'aaaaaaaa-0000-4000-8000-000000000000';
const RECEIPT: ReceiptView = {
  transferId: 'trf_1',
  folio: 'MW-7K3P9Q',
  amount: { amountMinor: 25000, currency: 'MXN' },
  recipient: { name: 'Luis Pérez', maskedIdentifier: '•••• 5432' },
  concept: 'Tacos',
  completedAt: '2026-10-14T20:00:00.000Z',
  balanceAfter: { amountMinor: 1209567, currency: 'MXN' },
};

type ConfirmData = ReceiptView | { status: 'in_progress' };
const success = <T>(data: T, status = 200): Result<ClientSuccess<T>, ClientError> =>
  ok({ data, status, requestId: REF });
const failure = (code: ClientError['code'], details?: ClientError['details']) =>
  err<ClientError>({ code, status: null, requestId: REF, ...(details ? { details } : {}) });

/** A promise the test resolves by hand, to keep a request "in flight". */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function setup(confirm: TransfersApi['confirm'], status: TransfersApi['status'] = vi.fn()) {
  const api = { confirm: vi.fn(confirm), status: vi.fn(status) } as unknown as TransfersApi & {
    confirm: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
  const report = vi.fn();
  const hook = renderHook(() => useConfirmTransfer({ api, timings: TIMINGS, report }));
  const run = () => act(() => hook.result.current.confirm(REQUEST));
  return { ...hook, api, report, run };
}

/** POST that ends in a client TIMEOUT once the 10 s pass (the client's own abort). */
const timesOut: TransfersApi['confirm'] = (_body, _key, { timeoutMs }) =>
  new Promise((resolve) => setTimeout(() => resolve(failure('TIMEOUT')), timeoutMs));

/** Answers in order; the last one repeats. */
function sequence<T>(first: T, ...rest: T[]): () => Promise<T> {
  const answers = [first, ...rest];
  let index = 0;
  return () => Promise.resolve(answers[Math.min(index++, answers.length - 1)] ?? first);
}

const statusSequence = (
  first: Result<ClientSuccess<AttemptStatus>, ClientError>,
  ...rest: Result<ClientSuccess<AttemptStatus>, ClientError>[]
) => sequence(first, ...rest);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('[TC-PL-08] useConfirmTransfer — response → state (TS-04 §8)', () => {
  it.each([
    ['201', success<ConfirmData>(RECEIPT, 201), { status: 'completed', receipt: RECEIPT }],
    [
      '503 NETWORK_UNAVAILABLE',
      failure('NETWORK_UNAVAILABLE'),
      { status: 'networkError', ref: REF },
    ],
    ['client NETWORK_ERROR', failure('NETWORK_ERROR'), { status: 'networkError', ref: REF }],
    [
      '422 INSUFFICIENT_FUNDS',
      failure('INSUFFICIENT_FUNDS', { balanceMinor: 18000 }),
      { status: 'insufficientFunds', balance: { amountMinor: 18000, currency: 'MXN' }, ref: REF },
    ],
    [
      '422 other rule',
      failure('SELF_TRANSFER'),
      { status: 'ruleViolation', code: 'SELF_TRANSFER', ref: REF },
    ],
    ['500 INTERNAL_ERROR', failure('INTERNAL_ERROR'), { status: 'unknownError', ref: REF }],
    [
      '409 IDEMPOTENCY_KEY_REUSED',
      failure('IDEMPOTENCY_KEY_REUSED'),
      { status: 'unknownError', ref: REF },
    ],
  ])('%s', async (_label, response, expected) => {
    const { result, run } = setup(() => Promise.resolve(response as never));
    await run();
    expect(result.current.state).toEqual(expected);
  });

  it('[UIR-CONF-01][AC-CONF-02] processing at once; a second press sends nothing', async () => {
    const pending = deferred<Result<ClientSuccess<ConfirmData>, ClientError>>();
    const { result, api } = setup(() => pending.promise);
    act(() => void result.current.confirm(REQUEST));
    act(() => void result.current.confirm(REQUEST));
    expect(result.current.state).toEqual({ status: 'processing', slow: false });
    expect(api.confirm).toHaveBeenCalledTimes(1);
    expect(api.confirm).toHaveBeenCalledWith(REQUEST.body, REQUEST.attemptKey, {
      timeoutMs: 10000,
      signal: expect.any(AbortSignal),
    });
    await act(async () => pending.resolve(success<ConfirmData>(RECEIPT, 201)));
  });

  it('[UIR-CONF-02] slow message at 3 s, still processing', async () => {
    const pending = deferred<Result<ClientSuccess<ConfirmData>, ClientError>>();
    const { result } = setup(() => pending.promise);
    act(() => void result.current.confirm(REQUEST));
    await act(() => vi.advanceTimersByTimeAsync(2999));
    expect(result.current.state).toEqual({ status: 'processing', slow: false });
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(result.current.state).toEqual({ status: 'processing', slow: true });
    await act(async () => pending.resolve(failure('NETWORK_ERROR')));
  });

  it('[UIR-CONF-03][UIR-CONF-04][AC-CONF-06] timeout at 10 s → verifying; checks at +2/+4/+8 s → completed', async () => {
    const { result, api, report } = setup(
      timesOut,
      statusSequence(
        success<AttemptStatus>({ status: 'in_progress' }),
        success<AttemptStatus>({ status: 'completed', receipt: RECEIPT }),
      ),
    );
    act(() => void result.current.confirm(REQUEST));
    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(result.current.state).toEqual({ status: 'verifying', checksDone: 0 });
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'tx.confirm.timeout', attemptKey: REQUEST.attemptKey }),
    );
    expect(api.status).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(2000)); // check 1: in progress
    expect(api.status).toHaveBeenCalledTimes(1);
    expect(api.status).toHaveBeenCalledWith(REQUEST.attemptKey, {
      requestId: REF,
      signal: expect.any(AbortSignal),
    });
    expect(result.current.state).toEqual({ status: 'verifying', checksDone: 1 });

    await act(() => vi.advanceTimersByTimeAsync(3999));
    expect(api.status).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1)); // check 2 at +4 s: completed
    expect(result.current.state).toEqual({ status: 'completed', receipt: RECEIPT });
  });

  it.each([
    [{ status: 'not_processed' }, { status: 'notProcessed', ref: REF }],
    [
      { status: 'failed', code: 'INSUFFICIENT_FUNDS', details: { balanceMinor: 100 } },
      { status: 'insufficientFunds', balance: { amountMinor: 100, currency: 'MXN' }, ref: REF },
    ],
    [
      { status: 'failed', code: 'INVALID_CONCEPT', details: null },
      { status: 'ruleViolation', code: 'INVALID_CONCEPT', ref: REF },
    ],
  ] as const)('[UIR-CONF-05][AC-CONF-07] status %o → %o', async (answer, expected) => {
    const { result } = setup(
      timesOut,
      statusSequence(success<AttemptStatus>(answer as AttemptStatus)),
    );
    act(() => void result.current.confirm(REQUEST));
    await act(() => vi.advanceTimersByTimeAsync(12000));
    expect(result.current.state).toEqual(expected);
  });

  it('[UIR-CONF-06][AC-CONF-08][AC-CONF-10] in progress or failing checks → unresolved after the third', async () => {
    const { result, api, report } = setup(
      timesOut,
      statusSequence(
        success<AttemptStatus>({ status: 'in_progress' }),
        failure('NETWORK_ERROR'),
        success<AttemptStatus>({ status: 'in_progress' }),
      ),
    );
    act(() => void result.current.confirm(REQUEST));
    await act(() => vi.advanceTimersByTimeAsync(10000 + 2000 + 4000 + 7999));
    expect(result.current.state).toEqual({ status: 'verifying', checksDone: 2 });
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(api.status).toHaveBeenCalledTimes(3);
    expect(result.current.state).toEqual({ status: 'unresolved', ref: REF });
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'tx.confirm.unresolved', details: { checks: 3 } }),
    );
    // Bounded: nothing else is scheduled.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('202 in progress → checks start right away', async () => {
    const { result, api } = setup(
      () => Promise.resolve(success<ConfirmData>({ status: 'in_progress' }, 202)),
      statusSequence(success<AttemptStatus>({ status: 'completed', receipt: RECEIPT })),
    );
    await run202(result);
    expect(api.status).toHaveBeenCalledTimes(1);
    expect(result.current.state).toEqual({ status: 'completed', receipt: RECEIPT });

    async function run202(r: typeof result) {
      act(() => void r.current.confirm(REQUEST));
      await act(() => vi.advanceTimersByTimeAsync(0));
    }
  });

  it('[BR-07][AC-CONF-04] "Intentar de nuevo" sends the same attempt key', async () => {
    const { result, api, run } = setup(
      sequence<Result<ClientSuccess<ConfirmData>, ClientError>>(
        failure('NETWORK_ERROR'),
        success<ConfirmData>(RECEIPT, 201),
      ),
    );
    await run();
    expect(result.current.state.status).toBe('networkError');
    await run();
    expect(result.current.state.status).toBe('completed');
    expect(api.confirm.mock.calls.map((call) => call[1])).toEqual([
      REQUEST.attemptKey,
      REQUEST.attemptKey,
    ]);
  });

  it('"Cambiar datos" returns to idle, but not while a request runs', async () => {
    const pending = deferred<Result<ClientSuccess<ConfirmData>, ClientError>>();
    const { result } = setup(() => pending.promise);
    act(() => void result.current.confirm(REQUEST));
    act(() => result.current.reset());
    expect(result.current.state.status).toBe('processing');
    await act(async () => pending.resolve(failure('NETWORK_ERROR')));
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('[UIR-CONF-16] unmount aborts the request and clears every timer; nothing is retried', async () => {
    let signal: AbortSignal | undefined;
    const { result, unmount, api } = setup((_b, _k, options) => {
      signal = options.signal;
      return new Promise(() => undefined);
    });
    act(() => void result.current.confirm(REQUEST));
    expect(vi.getTimerCount()).toBe(1); // the slow-message timer
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(60000);
    expect(api.confirm).toHaveBeenCalledTimes(1);
    expect(api.status).not.toHaveBeenCalled();
  });

  it('[UIR-CONF-16] unmount during verification stops the checks', async () => {
    const { result, unmount, api } = setup(
      timesOut,
      statusSequence(success<AttemptStatus>({ status: 'in_progress' })),
    );
    act(() => void result.current.confirm(REQUEST));
    await act(() => vi.advanceTimersByTimeAsync(12000));
    expect(api.status).toHaveBeenCalledTimes(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(60000);
    expect(api.status).toHaveBeenCalledTimes(1);
  });
});
