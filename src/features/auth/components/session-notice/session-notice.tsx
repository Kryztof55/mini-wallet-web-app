'use client';

import { useEffect } from 'react';
import { useAnnounce } from '@/shared/ui/live-announcer';
import { Notice } from '@/shared/ui/notice';
import { t } from '@/shared/lib/i18n/t';
import type { LoginReason } from '@/shared/lib/routes';

const MESSAGES: Record<LoginReason, Parameters<typeof t>[0]> = {
  session_ended: 'auth.session.ended',
  logged_out: 'auth.logout.done',
};

/** UIR-AUTH-17: explains why the user is on Login, shown and announced once. */
export function SessionNotice({ reason }: { readonly reason: LoginReason | null }) {
  const announce = useAnnounce();
  useEffect(() => {
    if (reason) announce(t(MESSAGES[reason]));
  }, [reason, announce]);

  if (!reason) return null;
  return <Notice tone={reason === 'logged_out' ? 'success' : 'info'}>{t(MESSAGES[reason])}</Notice>;
}
