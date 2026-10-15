import { redirect } from 'next/navigation';
import { SendAgain } from '@/features/transfer/components/send-again';
import { loginUrl } from '@/shared/lib/routes';
import { runInPageContext } from '@/server/logging/page-context';
import { getTransfersService } from '@/server/services/transfers.service';
import { getSession } from '@/server/session/session';

/**
 * "Enviar otra vez" (UIR-CONF-14): resolves who received that transfer on the server (the
 * client only ever saw the masked identifier), seeds the draft and opens the amount step.
 */
export default async function SendAgainPage({
  params,
}: {
  readonly params: Promise<{ readonly transferId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(loginUrl({ reason: 'session_ended' }));
  const { transferId } = await params;
  const result = await runInPageContext(() =>
    getTransfersService().getSendAgainRecipient(session.userId, transferId),
  );
  return <SendAgain recipient={result.ok ? result.value : null} />;
}
