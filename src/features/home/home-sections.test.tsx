import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveAnnouncerProvider } from '@/components/ui/live-announcer';
import { err, ok } from '@/core/result';
import { ThemeProvider } from '@/features/theme/theme-provider';
import { SEED_USER_IDS } from '@/server/mock/seed';
import { setupApiEnv, teardownApiEnv } from '@/test/api';
import { getA11yViolations } from '@/test/axe';
import { ActivityList } from './activity-list';
import { toActivityItemView } from './activity-view';
import type { HomeApi } from './api';
import { BalanceRetry } from './balance-retry';
import { HideBalanceProvider } from './hide-balance';
import { AppHeader } from './home-header';
import { ActivitySection, BalanceSection, Greeting } from './sections';
import { SendMoneyAction } from './send-money-action';
import { ActivitySkeleton, BalanceSkeleton } from './skeletons';

const REQUEST_ID = '3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b';

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-request-id': REQUEST_ID }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock('@/server/actions/set-theme', () => ({ setThemeAction: vi.fn() }));

beforeEach(() => setupApiEnv());
afterEach(() => teardownApiEnv());

function renderWithProviders(ui: ReactElement) {
  return render(
    <ThemeProvider initialTheme="system" persist={vi.fn()}>
      <LiveAnnouncerProvider>
        <HideBalanceProvider initialHidden={false}>{ui}</HideBalanceProvider>
      </LiveAnnouncerProvider>
    </ThemeProvider>,
  );
}

const summaryOk = ok({
  data: { firstName: 'Beto', balance: { amountMinor: 70000, currency: 'MXN' as const } },
  status: 200,
  requestId: 'r2',
});
const summaryFail = err({
  code: 'SERVICE_UNAVAILABLE' as const,
  status: 503,
  requestId: '9b8c7d6e-0000-4000-8000-000000000000',
});

describe('[TC-COMP-08] Home sections', () => {
  it('[UIR-HOME-02][AC-HOME-04] skeletons: one busy region per section with a text alternative', () => {
    const { container } = render(
      <>
        <BalanceSkeleton />
        <ActivitySkeleton />
      </>,
    );
    const busy = container.querySelectorAll('[aria-busy="true"]');
    expect(busy).toHaveLength(2);
    expect(screen.getAllByText('Cargando…')).toHaveLength(2);
  });

  it('[UIR-HOME-03] the primary action is always rendered and points to the transfer', () => {
    render(<SendMoneyAction />);
    expect(screen.getByRole('link', { name: 'Enviar dinero' })).toHaveAttribute(
      'href',
      '/transfer/recipient',
    );
  });

  it('[UIR-HOME-13] header: theme switcher and logout', () => {
    renderWithProviders(<AppHeader />);
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('radiogroup', { name: 'Tema' })).toBeVisible();
    expect(within(header).getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  });

  it('[AC-HOME-01] server sections render greeting, balance and the 10 latest items', async () => {
    renderWithProviders(
      <>
        <h1>{await Greeting({ userId: SEED_USER_IDS.ana })}</h1>
        {await BalanceSection({ userId: SEED_USER_IDS.ana })}
        {await ActivitySection({
          userId: SEED_USER_IDS.ana,
          timeZone: 'America/Mexico_City',
          highlightId: null,
        })}
      </>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Hola, Ana' })).toBeVisible();
    expect(screen.getByText('$12,345.67')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
  });

  it('[UIR-HOME-01][UIR-HOME-12][AC-HOME-06] a failing balance shows its own error with reference; greeting falls back to "Hola"; activity still renders', async () => {
    renderWithProviders(
      <>
        <h1>{await Greeting({ userId: SEED_USER_IDS.beto })}</h1>
        {await BalanceSection({ userId: SEED_USER_IDS.beto })}
        {await ActivitySection({
          userId: SEED_USER_IDS.beto,
          timeZone: 'America/Mexico_City',
          highlightId: null,
        })}
      </>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Hola' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'No pudimos cargar tu saldo.' })).toBeVisible();
    expect(screen.getByText('3F9A-12C4')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('[AC-HOME-06] a failing activity shows its error; the balance is unaffected', async () => {
    renderWithProviders(
      <>
        {await BalanceSection({ userId: SEED_USER_IDS.marta })}
        {await ActivitySection({
          userId: SEED_USER_IDS.marta,
          timeZone: 'America/Mexico_City',
          highlightId: null,
        })}
      </>,
    );
    expect(screen.getByText('$2,000.00')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'No pudimos cargar tus movimientos.' }),
    ).toBeVisible();
  });

  it('[UIR-HOME-12] retry calls only that section endpoint and renders the data', async () => {
    const api = {
      getSummary: vi.fn().mockResolvedValueOnce(summaryFail).mockResolvedValueOnce(summaryOk),
      getActivity: vi.fn(),
    } as unknown as HomeApi & {
      getSummary: ReturnType<typeof vi.fn>;
      getActivity: ReturnType<typeof vi.fn>;
    };
    const user = userEvent.setup();
    renderWithProviders(<BalanceRetry requestId={REQUEST_ID} api={api} />);

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByText('9B8C-7D6E')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByText('$700.00')).toBeVisible();
    expect(api.getSummary).toHaveBeenCalledTimes(2);
    expect(api.getActivity).not.toHaveBeenCalled();
  });

  it('[UIR-HOME-11] highlights the just-completed item and drops the URL parameter', async () => {
    window.history.replaceState(null, '', '/?highlight=txn_ana_01');
    const items = [
      toActivityItemView(
        {
          id: 'txn_ana_01',
          direction: 'out',
          counterparty: { name: 'Luis Pérez', maskedIdentifier: '•••• 5432' },
          amount: { amountMinor: 25000, currency: 'MXN' },
          concept: null,
          status: 'completed',
          occurredAt: new Date().toISOString(),
        },
        new Date(),
        'America/Mexico_City',
      ),
    ];
    await act(async () => {
      render(<ActivityList items={items} highlightId="txn_ana_01" />);
    });
    expect(screen.getByRole('listitem')).toHaveClass('bg-status-success-surface');
    expect(screen.getByRole('listitem').className).toContain('motion-safe:');
    expect(window.location.search).toBe('');
  });

  it('has no axe violations in the error state', async () => {
    const { container } = renderWithProviders(await BalanceSection({ userId: SEED_USER_IDS.beto }));
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
