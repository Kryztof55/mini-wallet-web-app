import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { HIDE_BALANCE_COOKIE } from './constants';
import { HideBalanceProvider, useHideBalance } from './hide-balance';

function wrapper(initialHidden: boolean) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <HideBalanceProvider initialHidden={initialHidden}>{children}</HideBalanceProvider>;
  }
  return Wrapper;
}

afterEach(() => {
  document.cookie = `${HIDE_BALANCE_COOKIE}=; Max-Age=0; Path=/`;
});

describe('[TC-PL-04][UIR-HOME-05] useHideBalance', () => {
  it('starts from the server value (cookie read on the server, no flash)', () => {
    expect(
      renderHook(() => useHideBalance(), { wrapper: wrapper(true) }).result.current.hidden,
    ).toBe(true);
    expect(
      renderHook(() => useHideBalance(), { wrapper: wrapper(false) }).result.current.hidden,
    ).toBe(false);
  });

  it('toggling persists the preference in the hide_balance cookie', () => {
    const { result } = renderHook(() => useHideBalance(), { wrapper: wrapper(false) });
    act(() => result.current.toggle());
    expect(result.current.hidden).toBe(true);
    expect(document.cookie).toContain(`${HIDE_BALANCE_COOKIE}=1`);
    act(() => result.current.toggle());
    expect(result.current.hidden).toBe(false);
    expect(document.cookie).toContain(`${HIDE_BALANCE_COOKIE}=0`);
  });

  it('outside a provider the balance is visible', () => {
    expect(renderHook(() => useHideBalance()).result.current.hidden).toBe(false);
  });
});
