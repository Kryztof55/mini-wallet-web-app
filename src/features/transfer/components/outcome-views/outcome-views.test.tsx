import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ANNOUNCE_DELAY_MS } from '@/shared/ui/live-announcer';
import { err, ok, type Result } from '@/core/common';
import { draftFingerprint, emptyDraft, type TransferDraft } from '@/features/transfer/state/draft';
import { draftProbe, mxn, RECIPIENT, TransferProviders } from '@/features/transfer/test-utils';
import type { ClientError, ClientSuccess } from '@/shared/lib/http/client';
import { getA11yViolations } from '@/test/axe';
import type { AttemptStatus, ReceiptView, TransfersApi } from '@/shared/api/transfers';
import { TransferConfirmation } from '@/features/transfer/components/transfer-confirmation';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const REF = 'abcd1234-0000-4000-8000-000000000000';
const KEY = '22222222-2222-4222-8222-222222222222';
const DATA = { recipient: RECIPIENT, amount: mxn(25000), concept: 'Tacos' };
// The fingerprint matches the data, so reaching the summary keeps this key (BR-07).
const DRAFT: TransferDraft = {
  ...emptyDraft,
  ...DATA,
  attempt: { key: KEY, fingerprint: draftFingerprint(DATA) },
};
const RECEIPT: ReceiptView = {
  transferId: 'trf_1',
  folio: 'MW-7K3P9Q',
  amount: mxn(25000),
  recipient: { name: 'Luis Pérez', maskedIdentifier: '•••• 5432' },
  concept: 'Tacos',
  completedAt: '2026-10-14T20:00:00.000Z',
  balanceAfter: mxn(1209567),
};
// Short timings so the timeline runs in real time.
const TIMINGS = {
  transferSlowMs: 40,
  transferTimeoutMs: 120,
  transferStatusCheckDelaysMs: [10, 10, 10],
};

type ConfirmResult = Result<ClientSuccess<ReceiptView | { status: 'in_progress' }>, ClientError>;
const failure = (code: ClientError['code'], details?: ClientError['details']): ConfirmResult =>
  err({ code, status: null, requestId: REF, ...(details ? { details } : {}) });

function setup({
  confirm = () => Promise.resolve(failure('NETWORK_ERROR')),
  status = () =>
    Promise.resolve(ok({ data: { status: 'in_progress' }, status: 200, requestId: REF })),
  hideBalance = false,
  timings = TIMINGS,
}: {
  confirm?: (...args: unknown[]) => Promise<ConfirmResult>;
  status?: () => Promise<Result<ClientSuccess<AttemptStatus>, ClientError>>;
  hideBalance?: boolean;
  timings?: typeof TIMINGS;
} = {}) {
  const api = { confirm: vi.fn(confirm), status: vi.fn(status) } as unknown as TransfersApi;
  const user = userEvent.setup();
  const utils = render(
    <TransferProviders draft={DRAFT} hideBalance={hideBalance}>
      <TransferConfirmation api={api} timings={timings} />
    </TransferProviders>,
  );
  const send = () => user.click(screen.getByRole('button', { name: 'Enviar $250.00' }));
  return { ...utils, user, api, send };
}

beforeEach(() => {
  router.push.mockClear();
  router.replace.mockClear();
  window.sessionStorage.clear();
});

describe('[TC-COMP-14] Confirmation views', () => {
  it('[UIR-CONF-01][UIR-CONF-02] processing: busy button, no edit/cancel, announced; slow message after the threshold', async () => {
    // Slow threshold above the announcer delay, so "Enviando…" is heard before it changes.
    const { send } = setup({
      confirm: () => new Promise(() => undefined),
      timings: { ...TIMINGS, transferSlowMs: ANNOUNCE_DELAY_MS + 300 },
    });
    await send();
    const button = screen.getByRole('button', { name: 'Enviando…' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('link', { name: 'Cambiar monto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('live-polite')).toHaveTextContent('Enviando…'));

    expect(await screen.findByText('Esto está tardando un poco más de lo normal…')).toBeVisible();
    await waitFor(() =>
      expect(screen.getByTestId('live-polite')).toHaveTextContent('Esto está tardando'),
    );
  });

  it('[UIR-CONF-04] verifying: heading focused, details, announced; no actions', async () => {
    const { send } = setup({
      confirm: () => new Promise((resolve) => setTimeout(() => resolve(failure('TIMEOUT')), 5)),
      status: () => new Promise(() => undefined),
    });
    await send();
    const heading = await screen.findByRole('heading', { name: 'Estamos verificando tu envío…' });
    expect(heading).toHaveFocus();
    expect(screen.getByText('$250.00')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await new Promise((r) => setTimeout(r, ANNOUNCE_DELAY_MS + 10));
    expect(screen.getByTestId('live-polite')).toHaveTextContent('Estamos verificando tu envío…');
  });

  it('[UIR-CONF-08][UIR-CONF-11][AC-CONF-03] network error: says money was not sent, details, reference, three actions', async () => {
    const { send, api, user } = setup();
    await send();
    expect(await screen.findByRole('heading', { name: 'No pudimos conectarnos' })).toHaveFocus();
    expect(
      screen.getByText('Tu dinero no se envió. Revisa tu conexión e intenta de nuevo.'),
    ).toBeVisible();
    expect(screen.getByText('Luis Pérez')).toBeVisible();
    expect(screen.getByText(/Referencia:/)).toHaveTextContent(/ABCD-1234/i);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cambiar datos' })).toBeVisible();

    // Retry: same attempt key (BR-07).
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(vi.mocked(api.confirm).mock.calls.map((c) => c[1])).toEqual([KEY, KEY]);
  });

  it('"Cambiar datos" goes back to the summary with the same data', async () => {
    const { send, user } = setup();
    await send();
    await user.click(await screen.findByRole('button', { name: 'Cambiar datos' }));
    expect(screen.getByRole('heading', { name: 'Revisa tu envío' })).toBeVisible();
    expect(draftProbe.current?.attempt?.key).toBe(KEY);
  });

  it('[UIR-CONF-05][AC-CONF-07] not processed after verification', async () => {
    const { send } = setup({
      confirm: () => Promise.resolve(failure('TIMEOUT')),
      status: () =>
        Promise.resolve(ok({ data: { status: 'not_processed' }, status: 200, requestId: REF })),
    });
    await send();
    expect(await screen.findByRole('heading', { name: 'No se procesó tu envío' })).toHaveFocus();
    expect(screen.getByText('Tu dinero no se envió. Puedes intentarlo de nuevo.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();
  });

  it('[UIR-CONF-09][AC-CONF-05] insufficient funds: updated balance, no retry; "Cambiar monto" opens the amount step with that balance', async () => {
    const { send, user } = setup({
      confirm: () => Promise.resolve(failure('INSUFFICIENT_FUNDS', { balanceMinor: 18000 })),
    });
    await send();
    expect(
      await screen.findByRole('heading', { name: 'No tienes saldo suficiente' }),
    ).toHaveFocus();
    expect(screen.getByText(/Saldo disponible:/)).toHaveTextContent(
      'No tienes saldo suficiente para este envío. Saldo disponible: $180.00',
    );
    expect(screen.queryByRole('button', { name: 'Intentar de nuevo' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cambiar monto' }));
    expect(router.push).toHaveBeenCalledWith('/transfer/amount');
    expect(draftProbe.current?.amount).toEqual(mxn(25000));
  });

  it('[EC-08] insufficient funds with hide-balance on: masked with a reveal control', async () => {
    const { send } = setup({
      confirm: () => Promise.resolve(failure('INSUFFICIENT_FUNDS', { balanceMinor: 18000 })),
      hideBalance: true,
    });
    await send();
    await screen.findByRole('heading', { name: 'No tienes saldo suficiente' });
    expect(screen.queryByText(/\$180\.00/)).not.toBeInTheDocument();
    expect(screen.getByText('Saldo oculto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar saldo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('[UIR-CONF-10][AC-CONF-09] unknown error: never says whether money moved; retry and Home', async () => {
    const { send, user } = setup({ confirm: () => Promise.resolve(failure('INTERNAL_ERROR')) });
    await send();
    expect(
      await screen.findByRole('heading', { name: 'No pudimos completar tu envío' }),
    ).toHaveFocus();
    expect(screen.getByText('Si se realizó, lo verás en tus movimientos.')).toBeVisible();
    expect(document.body).not.toHaveTextContent(/no se envió|Envío realizado/);
    await user.click(screen.getByRole('button', { name: 'Ir al inicio' }));
    expect(router.push).toHaveBeenCalledWith('/');
  });

  it('[UIR-CONF-06][AC-CONF-08] unresolved: safe-retry explanation, never asserts the result', async () => {
    const { send } = setup({ confirm: () => Promise.resolve(failure('TIMEOUT')) });
    await send();
    expect(
      await screen.findByRole('heading', { name: 'No pudimos confirmar el estado de tu envío' }),
    ).toHaveFocus();
    expect(screen.getByText(/no se enviará dos veces/)).toBeVisible();
    expect(document.body).not.toHaveTextContent(/no se envió|Envío realizado|se realizó/);
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ir al inicio' })).toBeVisible();
    expect(screen.getByText(/Referencia:/)).toBeVisible();
  });

  it('server rule violation: specific message and "Cambiar datos"', async () => {
    const { send } = setup({ confirm: () => Promise.resolve(failure('SELF_TRANSFER')) });
    await send();
    expect(await screen.findByRole('heading', { name: 'No pudimos hacer tu envío' })).toHaveFocus();
    expect(screen.getByText('No puedes enviarte dinero a ti mismo.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cambiar datos' })).toBeVisible();
  });

  it('[UIR-CONF-07] success: marks completion and replaces the summary with the receipt; draft untouched', async () => {
    const { send } = setup({
      confirm: () => Promise.resolve(ok({ data: RECEIPT, status: 201, requestId: REF })),
    });
    await send();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/receipts/trf_1'));
    expect(window.sessionStorage.getItem('mw.transfer.completed')).toBe('1');
    expect(screen.getByRole('status')).toHaveTextContent('Abriendo tu comprobante…');
    expect(router.replace).not.toHaveBeenCalledWith('/transfer/recipient');
    expect(draftProbe.current?.completed).toBe(false);
  });

  it('outcome views have no axe violations', async () => {
    const { send, container } = setup({ confirm: () => Promise.resolve(failure('TIMEOUT')) });
    await send();
    await screen.findByRole('heading', { name: 'No pudimos confirmar el estado de tu envío' });
    expect(await getA11yViolations(container)).toEqual([]);
    const actions = screen.getByRole('button', { name: 'Intentar de nuevo' }).parentElement;
    expect(within(actions as HTMLElement).getAllByRole('button')[0]).toHaveTextContent(
      'Intentar de nuevo',
    );
  });
});
