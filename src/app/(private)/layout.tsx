import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { BfcacheGuard } from '@/shared/components/bfcache-guard';
import { sanitizeReturnTo } from '@/core/auth';
import { loginUrl, RETURN_TO_HEADER } from '@/shared/lib/routes';
import { logEvent } from '@/server/logging/logger';
import { runInPageContext } from '@/server/logging/page-context';
import { getSession } from '@/server/session/session';

/**
 * Authority for every private view (BR-14, ADR-001): checks the signature AND the session
 * record, so it holds even if the proxy is skipped. Failure → login, then back here.
 */
export default async function PrivateLayout({ children }: { readonly children: ReactNode }) {
  const session = await runInPageContext(async () => {
    const found = await getSession();
    if (!found) logEvent('info', 'auth.session.rejected', { layer: 'layout' });
    return found;
  });
  if (!session) {
    const returnTo = sanitizeReturnTo((await headers()).get(RETURN_TO_HEADER));
    redirect(loginUrl({ returnTo, reason: 'session_ended' }));
  }
  return (
    <>
      <BfcacheGuard />
      {children}
    </>
  );
}
