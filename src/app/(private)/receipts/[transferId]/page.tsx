import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { ReceiptDetails } from '@/features/receipt/components/receipt-details';
import { ReceiptNotFound } from '@/features/receipt/components/receipt-not-found';
import { HIDE_BALANCE_COOKIE, HideBalanceProvider } from '@/shared/components/hide-balance';
import { AppHeader } from '@/shared/components/app-header';
import { formatFullDateTime } from '@/shared/lib/format/date';
import { t } from '@/shared/lib/i18n/t';
import { loginUrl } from '@/shared/lib/routes';
import { logEvent } from '@/server/logging/logger';
import { runInPageContext } from '@/server/logging/page-context';
import { getTransfersService } from '@/server/services/transfers.service';
import { getSession } from '@/server/session/session';
import type { UserId } from '@/core/ids';

type Params = { readonly params: Promise<{ readonly transferId: string }> };

/** One read per request, shared by the metadata and the page. */
const loadReceipt = cache(async (userId: UserId, transferId: string) =>
  getTransfersService().getReceipt(userId, transferId),
);

/** The tab names what is on screen, found or not (A11Y-02). */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const session = await getSession();
  if (!session) return { title: t('conf.receipt.title') };
  const found = await loadReceipt(session.userId, (await params).transferId);
  return { title: found.ok ? t('conf.receipt.title') : t('conf.receipt.not_found') };
}

/**
 * Receipt (UIR-CONF-15): server-rendered by ID, so reloading or reopening it shows the same
 * receipt and never submits anything. Someone else's receipt looks exactly like a missing one.
 */
export default async function ReceiptPage({ params }: Params) {
  const session = await getSession();
  if (!session) redirect(loginUrl({ reason: 'session_ended' }));
  const { transferId } = await params;
  const hidden = (await cookies()).get(HIDE_BALANCE_COOKIE)?.value === '1';

  const result = await runInPageContext(async () => {
    const found = await loadReceipt(session.userId, transferId);
    logEvent('info', found.ok ? 'receipt.viewed' : 'receipt.not_found', {
      transferId: transferId.slice(0, 64),
    });
    return found;
  });

  return (
    <HideBalanceProvider initialHidden={hidden}>
      <AppHeader />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-flow px-4 py-6 outline-none">
        {result.ok ? (
          <ReceiptDetails
            receipt={result.value}
            completedAt={formatFullDateTime(result.value.completedAt, session.timeZone)}
          />
        ) : (
          <ReceiptNotFound />
        )}
      </main>
    </HideBalanceProvider>
  );
}
