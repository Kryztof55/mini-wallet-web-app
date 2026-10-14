'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAnnounce } from '@/components/ui/live-announcer';
import { t } from '@/lib/i18n/t';
import { loginUrl } from '@/lib/routes';
import { authApi } from './api';

/**
 * Logout (FR-AUTH-10, AC-AUTH-15): POST, then a full navigation to Login so no in-memory
 * private state survives and Back cannot show cached private pages (they are `no-store`).
 */
export function LogoutButton({ api = authApi }: { readonly api?: typeof authApi }) {
  const [busy, setBusy] = useState(false);
  const announce = useAnnounce();

  const logout = async () => {
    if (busy) return;
    setBusy(true);
    const result = await api.logout();
    if (result.ok) {
      window.location.replace(loginUrl({ reason: 'logged_out' }));
      return;
    }
    setBusy(false);
    announce(
      t(result.error.code === 'NETWORK_ERROR' ? 'auth.error.network' : 'auth.error.service'),
      'assertive',
    );
  };

  return (
    <Button variant="ghost" size="sm" busy={busy} onClick={() => void logout()}>
      {t('auth.logout')}
    </Button>
  );
}
