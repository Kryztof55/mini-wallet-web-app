import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReceiptDetails, ReceiptNotFound } from '@/features/confirmation/receipt/receipt-details';
import { HIDE_BALANCE_COOKIE } from '@/features/home/constants';
import { HideBalanceProvider } from '@/features/home/hide-balance';
import { AppHeader } from '@/features/home/home-header';
import { formatFullDateTime } from '@/lib/format/date';
import { t } from '@/lib/i18n/t';
import { loginUrl } from '@/lib/routes';
import { logEvent } from '@/server/logging/logger';
import { runInPageContext } from '@/server/logging/page-context';
import { getTransfersService } from '@/server/services/transfers.service';
import { getSession } from '@/server/session/session';

export const metadata: Metadata = { title: t('conf.receipt.title') };

/**
 * Receipt (UIR-CONF-15): server-rendered by ID, so reloading or reopening it shows the same
 * receipt and never submits anything. Someone else's receipt looks exactly like a missing one.
 */
export default async function ReceiptPage({
  params,
}: {
  readonly params: Promise<{ readonly transferId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(loginUrl({ reason: 'session_ended' }));
  const { transferId } = await params;
  const hidden = (await cookies()).get(HIDE_BALANCE_COOKIE)?.value === '1';

  const result = await runInPageContext(async () => {
    const found = await getTransfersService().getReceipt(session.userId, transferId);
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
