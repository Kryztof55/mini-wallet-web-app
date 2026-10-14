import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppHeader } from '@/features/home/home-header';
import { TransferDraftProvider } from '@/features/transfer/state/draft-context';
import { TransferDataProvider, type TransferData } from '@/features/transfer/transfer-data';
import { REQUEST_ID_HEADER } from '@/lib/observability/request-id';
import { loginUrl } from '@/lib/routes';
import { runInPageContext } from '@/server/logging/page-context';
import { getRepositories } from '@/server/repositories';
import { getAccountService } from '@/server/services/account.service';
import { getContactsService } from '@/server/services/contacts.service';
import { getSession } from '@/server/session/session';

/**
 * Transfer flow shell (TS-03 §7): reads balance, favorites and the user's own identifiers on
 * the server and scopes the draft to the flow (ADR-003). The layout persists while moving
 * between steps, so the draft survives; leaving the flow discards it.
 */
export default async function TransferLayout({ children }: { readonly children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect(loginUrl({ reason: 'session_ended' }));

  const requestId = (await headers()).get(REQUEST_ID_HEADER);
  const [summary, favorites, user] = await runInPageContext(() =>
    Promise.all([
      getAccountService().getSummary(session.userId),
      getContactsService().list(session.userId),
      getRepositories().users.findById(session.userId),
    ]),
  );

  const data: TransferData = {
    balance: summary.ok ? { ok: true, value: summary.value.balance } : { ok: false, requestId },
    favorites: favorites.ok ? { ok: true, value: favorites.value } : { ok: false, requestId },
    ownIdentifiers: user?.identifiers ?? [],
  };

  return (
    <TransferDataProvider value={data}>
      <TransferDraftProvider>
        <AppHeader />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-flow px-4 py-6 outline-none">
          {children}
        </main>
      </TransferDraftProvider>
    </TransferDataProvider>
  );
}
