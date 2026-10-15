'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { Notice } from '@/shared/ui/notice';
import { parseOtpCode } from '@/core/auth';
import { t } from '@/shared/lib/i18n/t';
import type { CodeError, LoginState } from '@/features/auth/state/login-state';
import { OneTimeCodeField } from '@/features/auth/components/one-time-code-field';
import { ResendCountdown } from '@/features/auth/components/resend-countdown';

type LocalError = 'required' | 'format';

function validate(code: string): LocalError | null {
  if (code === '') return 'required';
  return parseOtpCode(code).ok ? null : 'format';
}

function codeErrorText(error: CodeError, attemptsLeft: number | null): string {
  if (error === 'incorrect') {
    return attemptsLeft === 1
      ? t('auth.code.error.incorrect_one')
      : t('auth.code.error.incorrect', { n: attemptsLeft ?? 0 });
  }
  return t(`auth.code.error.${error}`);
}

export type CodeStepProps = Pick<
  LoginState,
  'destination' | 'demoCode' | 'codeStatus' | 'codeError' | 'attemptsLeft' | 'resendAt' | 'notice'
> & {
  readonly verifying: boolean;
  readonly resending: boolean;
  readonly onVerify: (code: string) => void;
  readonly onResend: () => void;
  readonly onChangeIdentifier: () => void;
  readonly now?: () => number;
  /** Step-level error (service, network) rendered above the actions. */
  readonly children?: ReactNode;
};

/**
 * Step 2 (FS-01, UIR-AUTH-05…13). Focus lands on the code field, whose description states the
 * masked destination and the length. Wrong code → error with attempts left, content selected.
 * Locked or expired → field read-only, "Solicitar código nuevo" available and focused.
 */
export function CodeStep({
  destination,
  demoCode,
  codeStatus,
  codeError,
  attemptsLeft,
  resendAt,
  notice,
  verifying,
  resending,
  onVerify,
  onResend,
  onChangeIdentifier,
  now,
  children,
}: CodeStepProps) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<LocalError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resendRef = useRef<HTMLButtonElement>(null);
  const instructionsId = useId();
  const blocked = codeStatus !== 'active';

  // The parent remounts this step for every new code (`key`), which clears the field;
  // focus lands on it (UIR-AUTH-05, UIR-AUTH-12).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Wrong code: keep focus and select the content so typing replaces it (UIR-AUTH-09).
  useEffect(() => {
    if (codeError === 'incorrect' || codeError === 'format') {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [codeError, attemptsLeft]);

  // Locked or expired: the new-code action takes focus (UIR-AUTH-10).
  useEffect(() => {
    if (blocked) resendRef.current?.focus();
  }, [blocked]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${t('auth.code.title')} · Mini Wallet`;
    return () => {
      document.title = previous;
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (verifying || blocked) return;
    const found = validate(code);
    if (found) {
      setLocalError(found);
      inputRef.current?.focus();
      return;
    }
    onVerify(code);
  };

  const errorText = localError
    ? t(`auth.code.error.${localError}`)
    : codeError
      ? codeErrorText(codeError, attemptsLeft)
      : null;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t('auth.code.title')}</h1>
        <p id={instructionsId} className="text-base text-text-secondary">
          {t('auth.code.instructions', { destination: destination ?? '' })}
        </p>
      </div>

      {notice === 'code_resent' ? <Notice tone="success">{t('auth.resend.sent')}</Notice> : null}
      {notice === 'already_sent' ? <Notice>{t('auth.code.already_sent')}</Notice> : null}

      <OneTimeCodeField
        inputRef={inputRef}
        value={code}
        error={errorText}
        readOnly={verifying || blocked}
        describedBy={instructionsId}
        onChange={(next) => {
          setCode(next);
          if (localError) setLocalError(validate(next) === null ? null : localError);
        }}
        onBlur={() => {
          if (code !== '') setLocalError(validate(code));
        }}
      />

      {demoCode ? (
        <p className="rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-text-secondary">
          {t('auth.demo_hint', { code: demoCode })}
        </p>
      ) : null}

      {children}

      <div className="flex flex-col gap-3">
        <Button type="submit" fullWidth busy={verifying} busyLabel={t('auth.verify.loading')}>
          {t('auth.verify')}
        </Button>
        <ResendCountdown
          resendAt={resendAt}
          busy={resending}
          onResend={onResend}
          buttonRef={resendRef}
          {...(now ? { now } : {})}
        />
        <Button variant="ghost" onClick={onChangeIdentifier}>
          {t('auth.change_identifier')}
        </Button>
      </div>
    </form>
  );
}
