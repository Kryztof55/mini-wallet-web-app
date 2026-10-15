'use client';

import { useEffect, useRef, type Ref } from 'react';
import { Button } from '@/shared/ui/button';
import { useAnnounce } from '@/shared/ui/live-announcer';
import { t } from '@/shared/lib/i18n/t';
import { formatCountdown, useCountdown } from '@/features/auth/hooks/use-countdown';

/**
 * UIR-AUTH-11: while the cooldown runs, a text with the remaining time replaces the action;
 * it updates visually but is not announced every second. When it reaches zero the action
 * appears and that change is announced once.
 */
export function ResendCountdown({
  resendAt,
  busy,
  onResend,
  buttonRef,
  now,
}: {
  readonly resendAt: number | null;
  readonly busy: boolean;
  readonly onResend: () => void;
  readonly buttonRef?: Ref<HTMLButtonElement>;
  readonly now?: () => number;
}) {
  const { remainingSec, available } = useCountdown(resendAt, now);
  const announce = useAnnounce();
  const wasWaiting = useRef(!available);

  useEffect(() => {
    if (!available) {
      wasWaiting.current = true;
    } else if (wasWaiting.current) {
      wasWaiting.current = false;
      announce(t('auth.resend.available'));
    }
  }, [available, announce]);

  if (!available) {
    return (
      <p className="text-sm text-text-secondary">
        {t('auth.resend.cooldown', { time: formatCountdown(remainingSec) })}
      </p>
    );
  }
  return (
    <Button
      ref={buttonRef}
      variant="secondary"
      busy={busy}
      busyLabel={t('auth.resend.loading')}
      onClick={onResend}
    >
      {t('auth.resend')}
    </Button>
  );
}
