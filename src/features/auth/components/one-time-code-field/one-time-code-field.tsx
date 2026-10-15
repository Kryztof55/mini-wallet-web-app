import type { Ref } from 'react';
import { TextField } from '@/shared/ui/text-field';
import { OTP_LENGTH } from '@/core/otp';
import { t } from '@/shared/lib/i18n/t';

/** Digits only, at most six: typed, pasted ("123 456", "123-456") or autofilled. */
export function normalizeCodeInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

/**
 * One single field for the code (UIR-AUTH-07): numeric keyboard, OS one-time-code autofill,
 * paste normalized. No `maxLength`: it would truncate a pasted "123 456" before normalizing.
 * Never submits by itself when full (UIR-AUTH-08).
 */
export function OneTimeCodeField({
  value,
  onChange,
  onBlur,
  error,
  readOnly,
  describedBy,
  inputRef,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur?: () => void;
  readonly error: string | null;
  readonly readOnly: boolean;
  readonly describedBy?: string;
  readonly inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <TextField
      ref={inputRef}
      label={t('auth.code.label')}
      name="code"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      className="max-w-56"
      value={value}
      error={error}
      readOnly={readOnly}
      {...(describedBy ? { describedBy } : {})}
      onChange={(event) => onChange(normalizeCodeInput(event.target.value))}
      {...(onBlur ? { onBlur } : {})}
    />
  );
}
