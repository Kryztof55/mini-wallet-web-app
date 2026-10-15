import 'server-only';
import { domainError, type DomainError } from '@/core/errors';
import type { UserId } from '@/core/ids';
import type { Money } from '@/core/money';
import { err, ok, type Result } from '@/core/result';
import type { Transaction } from '@/core/transaction';
import { getConfig } from '@/shared/lib/config';
import { logEvent } from '@/server/logging/logger';
import { getRepositories } from '@/server/repositories';
import type { Repositories } from '@/server/repositories/ports';

export const HOME_OUTCOMES = ['service_unavailable'] as const;
type HomeOutcome = (typeof HOME_OUTCOMES)[number];

/** TS-02 §4. */
export type AccountSummary = { readonly firstName: string | null; readonly balance: Money };

/** What the client sees of a transaction: no internal owner ID. */
export type TransactionView = Omit<Transaction, 'userId'>;

type HomeError = DomainError<'SERVICE_UNAVAILABLE' | 'NOT_FOUND'>;

function toView({ userId: _userId, ...view }: Transaction): TransactionView {
  return view;
}

/**
 * Home reads (FS-02, TS-02 §5). Used by Server Components for the first render and by the
 * GET endpoints for section retries; each section fails on its own (UIR-HOME-01).
 */
export function createAccountService(deps: {
  readonly repos: Repositories;
  readonly activityLimit: number;
}) {
  const { repos, activityLimit } = deps;

  async function getSummary(
    userId: UserId,
    forced: HomeOutcome | null = null,
  ): Promise<Result<AccountSummary, HomeError>> {
    if (forced === 'service_unavailable') {
      logEvent('error', 'home.summary.failed', { errorCode: 'SERVICE_UNAVAILABLE', forced: true });
      return err(domainError('SERVICE_UNAVAILABLE'));
    }
    const [user, balance] = await Promise.all([
      repos.users.findById(userId),
      repos.accounts.getBalance(userId),
    ]);
    if (!balance.ok) {
      logEvent('error', 'home.summary.failed', { errorCode: balance.error.code });
      return err(balance.error);
    }
    if (!user) return err(domainError('NOT_FOUND'));
    logEvent('debug', 'home.summary.loaded');
    return ok({ firstName: user.firstName, balance: balance.value });
  }

  /** FR-HOME-10: never more than the configured limit, newest first. */
  async function getRecentTransactions(
    userId: UserId,
    requestedLimit: number = activityLimit,
    forced: HomeOutcome | null = null,
  ): Promise<Result<readonly TransactionView[], HomeError>> {
    if (forced === 'service_unavailable') {
      logEvent('error', 'home.activity.failed', { errorCode: 'SERVICE_UNAVAILABLE', forced: true });
      return err(domainError('SERVICE_UNAVAILABLE'));
    }
    const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), activityLimit);
    const result = await repos.transactions.listRecent(userId, limit);
    if (!result.ok) {
      logEvent('error', 'home.activity.failed', { errorCode: result.error.code });
      return err(result.error);
    }
    logEvent('debug', 'home.activity.loaded', { count: result.value.length });
    return ok(result.value.map(toView));
  }

  return { getSummary, getRecentTransactions };
}

export type AccountService = ReturnType<typeof createAccountService>;

export function getAccountService(): AccountService {
  return createAccountService({
    repos: getRepositories(),
    activityLimit: getConfig().activityLimit,
  });
}
