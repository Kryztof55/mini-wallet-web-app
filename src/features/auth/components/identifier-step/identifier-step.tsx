'use client';

import { useState, type FormEvent, type ReactNode, type Ref } from 'react';
import { Button } from '@/shared/ui/button';
import { TextField } from '@/shared/ui/text-field';
import { parseIdentifier } from '@/core/identity';
import { t } from '@/shared/lib/i18n/t';

type IdentifierError = 'required' | 'format';

function validate(value: string): IdentifierError | null {
  if (value.trim() === '') return 'required';
  return parseIdentifier(value).ok ? null : 'format';
}

export type IdentifierStepProps = {
  readonly defaultValue: string;
  readonly busy: boolean;
  /** The server rejected the submitted value (BR-10 is enforced there too). */
  readonly serverError: 'format' | null;
  readonly onSubmit: (identifier: string) => void;
  readonly inputRef?: Ref<HTMLInputElement>;
  /** Step-level error (service, network) rendered above the action. */
  readonly children?: ReactNode;
};

/**
 * Step 1 (FS-01): one field for phone or email (UIR-AUTH-01). Errors appear on blur or submit,
 * never while typing, and disappear as soon as the value becomes valid (UIR-AUTH-02).
 * "Continuar" stays enabled; pressing it with an invalid value shows the error and focuses
 * the field (UIR-AUTH-03).
 */
export function IdentifierStep({
  defaultValue,
  busy,
  serverError,
  onSubmit,
  inputRef,
  children,
}: IdentifierStepProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<IdentifierError | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const shownError = error ?? (serverError && value === submitted ? serverError : null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const found = validate(value);
    if (found) {
      setError(found);
      event.currentTarget.querySelector('input')?.focus();
      return;
    }
    setSubmitted(value);
    onSubmit(value);
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('auth.title')}</h1>
      <TextField
        ref={inputRef}
        label={t('auth.identifier.label')}
        hint={t('auth.identifier.hint')}
        error={shownError ? t(`auth.identifier.error.${shownError}`) : null}
        name="identifier"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={254}
        readOnly={busy}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          // Once shown, an error is re-evaluated live and disappears when the value is valid.
          if (error) setError(validate(next) === null ? null : error);
        }}
        onBlur={() => {
          if (value.trim() !== '') setError(validate(value));
        }}
      />
      {children}
      <Button type="submit" fullWidth busy={busy} busyLabel={t('auth.continue.loading')}>
        {t('auth.continue')}
      </Button>
    </form>
  );
}
