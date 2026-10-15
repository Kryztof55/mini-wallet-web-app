import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { failure, fakeAuthApi, issued, REQUEST_ID, verified } from '@/features/auth/test-utils';
import { useLoginFlow } from './use-login-flow';

const NOW = 1_000_000;

function setup(api = fakeAuthApi(), returnTo?: string) {
  const onSuccess = vi.fn();
  const hook = renderHook(() =>
    useLoginFlow({ api, now: () => NOW, returnTo, timeZone: 'America/Mexico_City', onSuccess }),
  );
  return { ...hook, api, onSuccess };
}

describe('[TC-PL-01][UIR-AUTH-04][UIR-AUTH-09][UIR-AUTH-10][UIR-AUTH-12][UIR-AUTH-13] useLoginFlow', () => {
  it('identifier → requesting → code step with destination, demo code and cooldown', async () => {
    const { result, api } = setup();
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.requestCode('5512345678');
    });
    expect(result.current.state.pending).toBe('code');
    await act(() => pending);

    expect(api.requestCode).toHaveBeenCalledWith('5512345678');
    expect(result.current.state).toMatchObject({
      step: 'code',
      pending: null,
      destination: '•••• 5678',
      demoCode: '482915',
      resendAt: NOW + 30_000,
      codeStatus: 'active',
      notice: null,
    });
  });

  it('sends exactly one request when submitted twice quickly (AC-AUTH-05)', async () => {
    const { result, api } = setup();
    await act(() =>
      Promise.all([
        result.current.requestCode('5512345678'),
        result.current.requestCode('5512345678'),
      ]),
    );
    expect(api.requestCode).toHaveBeenCalledOnce();
  });

  it('verify → success calls onSuccess with the server redirect and stays busy', async () => {
    const api = fakeAuthApi({ verify: vi.fn().mockResolvedValue(verified('/transfer/amount')) });
    const { result, onSuccess } = setup(api, '/transfer/amount');
    await act(() => result.current.requestCode('5512345678'));
    await act(() => result.current.verify('482915'));

    expect(api.verify).toHaveBeenCalledWith({
      identifier: '5512345678',
      code: '482915',
      timeZone: 'America/Mexico_City',
      returnTo: '/transfer/amount',
    });
    expect(onSuccess).toHaveBeenCalledWith('/transfer/amount');
    expect(result.current.state.pending).toBe('verify');
    // No second verification after success.
    await act(() => result.current.verify('482915'));
    expect(api.verify).toHaveBeenCalledOnce();
  });

  it('incorrect → attempts left; then locked → resend available now', async () => {
    const api = fakeAuthApi({
      verify: vi
        .fn()
        .mockResolvedValueOnce(failure('CODE_INCORRECT', { attemptsLeft: 2 }))
        .mockResolvedValueOnce(failure('CODE_INCORRECT', { attemptsLeft: 1 }))
        .mockResolvedValueOnce(failure('CODE_LOCKED')),
    });
    const { result } = setup(api);
    await act(() => result.current.requestCode('5512345678'));

    await act(() => result.current.verify('111111'));
    expect(result.current.state).toMatchObject({
      codeError: 'incorrect',
      attemptsLeft: 2,
      pending: null,
    });
    await act(() => result.current.verify('111111'));
    expect(result.current.state.attemptsLeft).toBe(1);
    await act(() => result.current.verify('111111'));
    expect(result.current.state).toMatchObject({
      codeStatus: 'locked',
      codeError: 'locked',
      resendAt: NOW,
    });
  });

  it('expired → blocked with resend available now', async () => {
    const api = fakeAuthApi({ verify: vi.fn().mockResolvedValue(failure('CODE_EXPIRED')) });
    const { result } = setup(api);
    await act(() => result.current.requestCode('5512345678'));
    await act(() => result.current.verify('482915'));
    expect(result.current.state).toMatchObject({
      codeStatus: 'expired',
      codeError: 'expired',
      resendAt: NOW,
    });
  });

  it('a new code resets attempts, status and announces itself', async () => {
    const api = fakeAuthApi({
      verify: vi.fn().mockResolvedValue(failure('CODE_LOCKED')),
      requestCode: vi
        .fn()
        .mockResolvedValueOnce(issued())
        .mockResolvedValueOnce(issued({ demoCode: '000111' })),
    });
    const { result } = setup(api);
    await act(() => result.current.requestCode('5512345678'));
    await act(() => result.current.verify('111111'));
    const version = result.current.state.codeVersion;

    await act(() => result.current.resend());
    expect(api.requestCode).toHaveBeenLastCalledWith('5512345678');
    expect(result.current.state).toMatchObject({
      codeStatus: 'active',
      attemptsLeft: null,
      codeError: null,
      demoCode: '000111',
      notice: 'code_resent',
      codeVersion: version + 1,
    });
  });

  it('change identifier keeps the value', async () => {
    const { result } = setup();
    await act(() => result.current.requestCode('5512345678'));
    act(() => result.current.changeIdentifier());
    expect(result.current.state).toMatchObject({ step: 'identifier', identifier: '5512345678' });
  });

  it('throttled on step 1 → code step with a client-masked destination and the remaining wait', async () => {
    const api = fakeAuthApi({
      requestCode: vi.fn().mockResolvedValue(failure('CODE_THROTTLED', { retryAfterSec: 20 }, 429)),
    });
    const { result } = setup(api);
    await act(() => result.current.requestCode('ana@demo.mx'));
    expect(result.current.state).toMatchObject({
      step: 'code',
      destination: 'a•••@demo.mx',
      demoCode: null,
      resendAt: NOW + 20_000,
      notice: 'already_sent',
    });
  });

  it('throttled on resend → keeps the step and updates the wait', async () => {
    const api = fakeAuthApi({
      requestCode: vi
        .fn()
        .mockResolvedValueOnce(issued())
        .mockResolvedValueOnce(failure('CODE_THROTTLED', { retryAfterSec: 12 }, 429)),
    });
    const { result } = setup(api);
    await act(() => result.current.requestCode('5512345678'));
    await act(() => result.current.resend());
    expect(result.current.state).toMatchObject({
      step: 'code',
      resendAt: NOW + 12_000,
      pending: null,
    });
  });

  it('server-side identifier rejection returns to step 1 with a format error', async () => {
    const api = fakeAuthApi({
      requestCode: vi.fn().mockResolvedValue(failure('INVALID_IDENTIFIER')),
    });
    const { result } = setup(api);
    await act(() => result.current.requestCode('5599'));
    expect(result.current.state).toMatchObject({ step: 'identifier', identifierError: 'format' });
  });

  it.each([
    ['SERVICE_UNAVAILABLE', 'service'],
    ['NETWORK_ERROR', 'network'],
    ['TIMEOUT', 'timeout'],
    ['CSRF_REJECTED', 'service'],
  ] as const)(
    '%s → step error %s with the request ID; retry repeats the request',
    async (code, kind) => {
      const api = fakeAuthApi({
        requestCode: vi
          .fn()
          .mockResolvedValueOnce(failure(code, undefined, null))
          .mockResolvedValueOnce(issued()),
      });
      const { result } = setup(api);
      await act(() => result.current.requestCode('5512345678'));
      expect(result.current.state).toMatchObject({
        step: 'identifier',
        identifier: '5512345678',
        stepError: { kind, requestId: REQUEST_ID },
      });

      await act(() => result.current.retry());
      expect(api.requestCode).toHaveBeenCalledTimes(2);
      expect(result.current.state).toMatchObject({ step: 'code', stepError: null });
    },
  );
});
