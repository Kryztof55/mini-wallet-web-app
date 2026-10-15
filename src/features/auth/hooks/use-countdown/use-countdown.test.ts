import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatCountdown, useCountdown } from './use-countdown';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-14T18:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('[TC-PL-02][UIR-AUTH-11] useCountdown', () => {
  it('counts down from the server value and becomes available at zero', () => {
    const target = Date.now() + 3000;
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current).toEqual({ remainingSec: 3, available: false });

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remainingSec).toBe(2);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toEqual({ remainingSec: 0, available: true });
    // Stopped: no timers left running at zero.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('is available immediately without a target or with a past one', () => {
    expect(renderHook(() => useCountdown(null)).result.current.available).toBe(true);
    expect(renderHook(() => useCountdown(Date.now() - 1)).result.current.available).toBe(true);
  });

  it('restarts when the target changes (new code issued)', () => {
    let target = Date.now() + 2000;
    const { result, rerender } = renderHook(() => useCountdown(target));
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.available).toBe(true);

    target = Date.now() + 30_000;
    rerender();
    expect(result.current).toEqual({ remainingSec: 30, available: false });
  });

  it('cleans up its timer on unmount', () => {
    const { unmount } = renderHook(() => useCountdown(Date.now() + 10_000));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [30, '0:30'],
    [65, '1:05'],
  ])('formats %i s as %s', (seconds, text) => {
    expect(formatCountdown(seconds)).toBe(text);
  });
});
