import { z } from 'zod';
import type { AttemptKey } from '@/core/ids';
import { jsonOk, withApi } from '@/server/http';
import { withSession } from '@/server/http/with-session';
import { getTransfersService } from '@/server/services/transfers.service';

const ROUTE = '/api/transfers/attempts/[key]';

type Params = { readonly params: Promise<{ readonly key: string }> };

/**
 * What happened to an attempt (TS-04 §5), used by the client after a timeout. A key this user
 * never sent — including a malformed one — is `not_processed` (BR-17).
 */
export const GET = withApi(
  ROUTE,
  withSession(async (_request, { requestId, session }, { params }: Params) => {
    const { key } = await params;
    if (!z.uuid().safeParse(key).success) return jsonOk({ status: 'not_processed' }, requestId);
    const status = await getTransfersService().getAttemptStatus(session.userId, key as AttemptKey);
    return jsonOk(status, requestId);
  }),
);
