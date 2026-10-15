'use client';

import type { ChangeEvent, KeyboardEvent, Ref } from 'react';
import { TextField } from '@/shared/ui/text-field';
import { editAmountText } from '@/core/money';

/**
 * Amount input (UIR-TX-10): fixed "$" before the value, es-MX grouping while typing, only
 * digits and one point with two decimals (BR-04), numeric keyboard. The caret stays after the
 * digit it followed, and Backspace/Delete next to a grouping comma removes the digit beyond it.
 */
export function MoneyInput({
  label,
  display,
  onTextChange,
  error,
  describedBy,
  ref,
}: {
  readonly label: string;
  /** Grouped value, e.g. `1,250.5`. */
  readonly display: string;
  /** Receives the cleaned value without grouping, e.g. `1250.5`. */
  readonly onTextChange: (text: string) => void;
  readonly error?: string | null;
  readonly describedBy?: string;
  readonly ref?: Ref<HTMLInputElement>;
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const edit = editAmountText(input.value, input.selectionStart ?? input.value.length);
    // Write the formatted value and caret now; React then sees the same value and keeps them.
    input.value = edit.display;
    input.setSelectionRange(edit.caret, edit.caret);
    onTextChange(edit.text);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const { selectionStart: start, selectionEnd: end, value } = input;
    if (start === null || start !== end) return;
    if (event.key === 'Backspace' && value[start - 1] === ',') {
      input.setSelectionRange(start - 1, start - 1);
    } else if (event.key === 'Delete' && value[start] === ',') {
      input.setSelectionRange(start + 1, start + 1);
    }
  };

  return (
    <TextField
      ref={ref}
      label={label}
      name="amount"
      inputMode="decimal"
      autoComplete="transaction-amount"
      enterKeyHint="next"
      spellCheck={false}
      startAdornment="$"
      value={display}
      error={error}
      describedBy={describedBy}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
}
