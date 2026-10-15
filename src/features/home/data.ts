import 'server-only';
import { cache } from 'react';
import type { UserId } from '@/core/common';
import { runInPageContext } from '@/server/logging/page-context';
import { getAccountService } from '@/server/services/account.service';

/**
 * Per-request reads for Home. `cache` dedupes them within one render, so the greeting and
 * the balance section share a single summary request.
 */
export const loadSummary = cache((userId: UserId) =>
  runInPageContext(() => getAccountService().getSummary(userId)),
);

export const loadActivity = cache((userId: UserId) =>
  runInPageContext(() => getAccountService().getRecentTransactions(userId)),
);
