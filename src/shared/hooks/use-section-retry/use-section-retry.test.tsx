import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { err, ok } from '@/core/result';
import { useSectionRetry } from './use-section-retry';

const success = (data: string) => ok({ data, status: 200, requestId: 'req-ok' });
const failure = (requestId: string) =>
  err({ code: 'SERVICE_UNAVAILABLE' as const, status: 503, requestId });

describe('[TC-PL-03][UIR-HOME-12] useSectionRetry', () => {
  it('starts in error with the server request ID, then loading → ready on success', async () => {
    let resolve!: (value: ReturnType<typeof success>) => void;
    const load = vi.fn(() => new Promise<ReturnType<typeof success>>((r) => (resolve = r)));
    const { result } = renderHook(() => useSectionRetry(load, 'req-server'));
    expect(result.current.state).toEqual({ status: 'error', requestId: 'req-server' });

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.retry();
    });
    expect(result.current.state).toEqual({ status: 'loading', requestId: 'req-server' });
    await act(async () => {
      resolve(success('data'));
      await pending;
    });
    expect(result.current.state).toEqual({ status: 'ready', data: 'data' });
    expect(load).toHaveBeenCalledOnce();
  });

  it('shows the new request ID when the retry fails again', async () => {
    const load = vi.fn().mockResolvedValue(failure('req-retry'));
    const { result } = renderHook(() => useSectionRetry(load, 'req-server'));
    await act(() => result.current.retry());
    expect(result.current.state).toEqual({ status: 'error', requestId: 'req-retry' });
  });

  it('ignores a second retry while one is in flight', async () => {
    const load = vi.fn().mockResolvedValue(success('x'));
    const { result } = renderHook(() => useSectionRetry(load, null));
    await act(() => Promise.all([result.current.retry(), result.current.retry()]));
    expect(load).toHaveBeenCalledOnce();
  });
});
