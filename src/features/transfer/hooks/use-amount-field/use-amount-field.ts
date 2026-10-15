'use client';

import { useCallback, useState } from 'react';
import { formatAmountText, moneyToAmountText, parseAmountInput } from '@/core/money';
import { Money } from '@/core/money';
import { validateAmount } from '@/core/transfers';

/** `min` = BR-01 (empty or zero), `balance` = BR-02 (more than the available balance). */
export type AmountError = 'min' | 'balance';

export type AmountCheck =
  | { readonly ok: true; readonly amount: Money }
  | { readonly ok: false; readonly reason: AmountError | 'balance_unavailable' };

function parsed(text: string): Money | null {
  const result = parseAmountInput(text);
  return result.ok ? result.value : null;
}

/**
 * UIR-TX-12 timing: BR-02 shows as soon as the amount exceeds the balance; BR-01 only when
 * the user presses "Continuar". Either error clears as soon as the value becomes valid.
 */
function liveError(current: AmountError | null, amount: Money | null, balance: Money | null) {
  if (balance && amount && Money.compare(amount, balance) > 0) return 'balance';
  if (current === 'min' && (amount === null || Money.isZero(amount))) return 'min';
  return null;
}

/**
 * Amount field state for step 2 (TS-03 §6). `text` is the cleaned value without grouping;
 * the domain decides what is valid. `balance` is null while it cannot be loaded.
 */
export function useAmountField({
  initial,
  balance,
}: {
  readonly initial: Money | null;
  readonly balance: Money | null;
}) {
  const [text, setText] = useState(() => (initial ? moneyToAmountText(initial) : ''));
  const [error, setError] = useState<AmountError | null>(() => liveError(null, initial, balance));

  // The balance can arrive later (retry); re-derive the live error from it while rendering.
  const shownError = liveError(error, parsed(text), balance);

  const change = useCallback(
    (next: string) => {
      setText(next);
      setError((current) => liveError(current, parsed(next), balance));
    },
    [balance],
  );

  /** "Continuar": every rule, with the error shown if one fails. */
  const check = useCallback((): AmountCheck => {
    if (!balance) return { ok: false, reason: 'balance_unavailable' };
    const result = validateAmount(parsed(text), balance);
    if (result.ok) {
      setError(null);
      return { ok: true, amount: result.value };
    }
    const reason: AmountError = result.error.code === 'INSUFFICIENT_FUNDS' ? 'balance' : 'min';
    setError(reason);
    return { ok: false, reason };
  }, [balance, text]);

  return { text, display: formatAmountText(text), error: shownError, change, check } as const;
}
