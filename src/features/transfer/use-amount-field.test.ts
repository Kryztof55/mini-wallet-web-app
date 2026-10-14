import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Money } from '@/core/money';
import { mxn } from './test-utils';
import { useAmountField, type AmountCheck } from './use-amount-field';

/** `check` sets state, so it runs inside act. */
function checkNow(result: { readonly current: { check: () => AmountCheck } }): AmountCheck {
  let outcome: AmountCheck | undefined;
  act(() => {
    outcome = result.current.check();
  });
  if (!outcome) throw new Error('check did not run');
  return outcome;
}

const BALANCE = mxn(100000); // $1,000.00

function field(balance: Money | null = BALANCE, initial: Money | null = null) {
  return renderHook(({ b }) => useAmountField({ initial, balance: b }), {
    initialProps: { b: balance },
  });
}

describe('[TC-PL-06][UIR-TX-12] useAmountField', () => {
  it('[BR-02] shows the balance error as soon as the amount exceeds it, and clears it', () => {
    const { result } = field();
    act(() => result.current.change('1000.01'));
    expect(result.current.error).toBe('balance');
    act(() => result.current.change('1000.00'));
    expect(result.current.error).toBeNull();
  });

  it('[BR-01] shows "greater than zero" only on continue, and clears it once valid', () => {
    const { result } = field();
    act(() => result.current.change('0'));
    expect(result.current.error).toBeNull();

    const check = checkNow(result);
    expect(check).toEqual({ ok: false, reason: 'min' });
    expect(result.current.error).toBe('min');

    act(() => result.current.change('0.0'));
    expect(result.current.error).toBe('min');
    act(() => result.current.change('0.01'));
    expect(result.current.error).toBeNull();
  });

  it('empty amount on continue is BR-01', () => {
    const { result } = field();
    const check = checkNow(result);
    expect(check).toEqual({ ok: false, reason: 'min' });
  });

  it('continue with a valid amount returns Money in minor units (EC-01: equal to balance)', () => {
    const { result } = field();
    act(() => result.current.change('1000'));
    expect(checkNow(result)).toEqual({ ok: true, amount: mxn(100000) });
  });

  it('formats for display and pre-fills from the draft', () => {
    const { result } = field(BALANCE, mxn(25050));
    expect(result.current.text).toBe('250.50');
    expect(result.current.display).toBe('250.50');
    act(() => result.current.change('1250.5'));
    expect(result.current.display).toBe('1,250.5');
  });

  it('[UIR-TX-11] without a balance, continue reports it is needed; BR-02 applies once it arrives', () => {
    const { result, rerender } = field(null);
    act(() => result.current.change('5000'));
    expect(result.current.error).toBeNull();
    expect(checkNow(result)).toEqual({ ok: false, reason: 'balance_unavailable' });

    rerender({ b: BALANCE });
    expect(result.current.error).toBe('balance');
  });

  it('[EC-05] zero balance: any amount exceeds it', () => {
    const { result } = field(mxn(0));
    act(() => result.current.change('0.01'));
    expect(result.current.error).toBe('balance');
  });
});
