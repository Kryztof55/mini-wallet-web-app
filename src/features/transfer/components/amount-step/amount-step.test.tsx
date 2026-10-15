import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@/core/result';
import { getA11yViolations } from '@/test/axe';
import { AmountStep } from './amount-step';
import { emptyDraft, type TransferDraft } from '@/features/transfer/state/draft';
import {
  draftProbe,
  mxn,
  RECIPIENT,
  TransferProviders,
  transferData,
} from '@/features/transfer/test-utils';
import type { LoadBalance } from '@/features/transfer/state/transfer-data';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const withRecipient: TransferDraft = { ...emptyDraft, recipient: RECIPIENT };

function setup({
  draft = withRecipient,
  data = transferData(),
  loadBalance,
}: {
  draft?: TransferDraft;
  data?: ReturnType<typeof transferData>;
  loadBalance?: LoadBalance;
} = {}) {
  const user = userEvent.setup();
  const utils = render(
    <TransferProviders data={data} draft={draft} {...(loadBalance ? { loadBalance } : {})}>
      <AmountStep />
    </TransferProviders>,
  );
  const amount = () => screen.getByRole('textbox', { name: 'Monto' }) as HTMLInputElement;
  const concept = () => screen.getByRole('textbox', { name: 'Concepto (opcional)' });
  const next = () => user.click(screen.getByRole('button', { name: 'Continuar' }));
  return { ...utils, user, amount, concept, next };
}

beforeEach(() => {
  router.push.mockClear();
  router.replace.mockClear();
});

describe('[TC-COMP-11] Amount step', () => {
  it('[UIR-TX-09] heading focused, recipient context with "Cambiar"', () => {
    setup();
    expect(screen.getByText('Paso 2 de 3 — Monto')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: '¿Cuánto le envías?' })).toHaveFocus();
    expect(screen.getByText('Luis Pérez')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Cambiar destinatario' })).toBeVisible();
  });

  it('[UIR-TX-10][AC-TX-04] numeric keyboard, grouping while typing, no letters or third decimal', async () => {
    const { user, amount } = setup();
    expect(amount()).toHaveAttribute('inputmode', 'decimal');
    await user.type(amount(), '1250a.507');
    expect(amount()).toHaveValue('1,250.50');
  });

  it('[UIR-TX-10] the caret stays after the digit typed in the middle of a grouped value', async () => {
    const { user, amount } = setup();
    await user.type(amount(), '1234');
    expect(amount()).toHaveValue('1,234');
    // Caret right after "1,": type 5 → "15,234" with the caret after the 5.
    await user.type(amount(), '5', { initialSelectionStart: 2, initialSelectionEnd: 2 });
    expect(amount()).toHaveValue('15,234');
    expect(amount().selectionStart).toBe(2);
    // Backspace right after a comma deletes the digit before it, not the comma.
    amount().setSelectionRange(3, 3);
    await user.keyboard('{Backspace}');
    expect(amount()).toHaveValue('1,234');
  });

  it('[UIR-TX-11] balance shown and linked to the field as its description', () => {
    const { amount } = setup();
    expect(amount()).toHaveAccessibleDescription('Saldo disponible: $1,000.00');
  });

  it('[UIR-TX-12][AC-TX-03] BR-02 appears while typing and clears when valid', async () => {
    const { user, amount, next } = setup();
    await user.type(amount(), '1000.01');
    expect(screen.getByText('El monto supera tu saldo disponible ($1,000.00).')).toBeVisible();
    expect(amount()).toHaveAttribute('aria-invalid', 'true');
    await next();
    expect(router.push).not.toHaveBeenCalled();

    await user.type(amount(), '{Backspace}');
    expect(screen.queryByText(/supera tu saldo/)).not.toBeInTheDocument();
  });

  it('[UIR-TX-12][UIR-TX-13][AC-TX-02] BR-01 only on Continuar; focus goes to the amount', async () => {
    const { user, amount, next } = setup();
    await user.type(amount(), '0');
    expect(screen.queryByText('Ingresa un monto mayor a $0.00.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('heading', { level: 1 }));
    await next();
    expect(screen.getByText('Ingresa un monto mayor a $0.00.')).toBeVisible();
    expect(amount()).toHaveFocus();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('[UIR-TX-15][AC-TX-11] concept stops at 40 characters with a counter', async () => {
    const { user, concept } = setup();
    expect(screen.getByText('0/40')).toBeVisible();
    await user.type(concept(), 'x'.repeat(45));
    expect(concept()).toHaveValue('x'.repeat(40));
    expect(screen.getByText('40/40')).toBeVisible();
    expect(concept()).toHaveAccessibleDescription('40/40');
  });

  it('Continuar saves amount and trimmed concept, then opens the summary', async () => {
    const { user, amount, concept, next } = setup();
    await user.type(amount(), '250');
    await user.type(concept(), '  Tacos  ');
    await next();
    expect(draftProbe.current?.amount).toEqual(mxn(25000));
    expect(draftProbe.current?.concept).toBe('Tacos');
    expect(router.push).toHaveBeenCalledWith('/transfer/summary');
  });

  it('[AC-TX-12] returning from the summary pre-fills amount and concept', () => {
    const { amount, concept } = setup({
      draft: { ...withRecipient, amount: mxn(25000), concept: 'Tacos' },
    });
    expect(amount()).toHaveValue('250.00');
    expect(concept()).toHaveValue('Tacos');
  });

  it('[UIR-TX-11] balance error: retry only reloads the balance; Continuar explains it is needed', async () => {
    const loadBalance = vi
      .fn<LoadBalance>()
      .mockResolvedValueOnce(
        err({ code: 'SERVICE_UNAVAILABLE', status: 503, requestId: 'b2c3d4e5-0000' }),
      )
      .mockResolvedValueOnce(ok(mxn(50000)));
    const { user, amount, next } = setup({
      data: transferData({ balance: { ok: false, requestId: 'a1b2c3d4-0000' } }),
      loadBalance,
    });
    expect(
      screen.getByRole('heading', {
        name: 'No pudimos cargar tu saldo. Lo necesitamos para validar el monto.',
      }),
    ).toBeVisible();
    await user.type(amount(), '100');
    await next();
    expect(router.push).not.toHaveBeenCalled();
    expect(amount()).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    await waitFor(() => expect(loadBalance).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByText('Saldo disponible: $500.00')).toBeVisible();
    await next();
    expect(router.push).toHaveBeenCalledWith('/transfer/summary');
  });

  it('[UIR-TX-06] the contact notice from step 1 is shown once', async () => {
    const { user, amount, next } = setup({
      draft: { ...withRecipient, notice: { kind: 'saved', name: 'Luis Pérez' } },
    });
    expect(screen.getByText('Guardamos a Luis Pérez en tus favoritos.')).toBeVisible();
    await user.type(amount(), '10');
    await next();
    expect(draftProbe.current?.notice).toBeNull();
  });

  it('[UIR-TX-20] "Cancelar envío" goes Home; the step guard does not send it to step 1', async () => {
    const { user, amount } = setup();
    await user.type(amount(), '100');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar envío' }));
    expect(router.push).toHaveBeenCalledWith('/');
    expect(router.replace).not.toHaveBeenCalledWith('/transfer/recipient');
    expect(draftProbe.current).toMatchObject({ recipient: null, amount: null, completed: true });
  });

  it('has no axe violations, with and without errors', async () => {
    const { container, user, amount } = setup();
    expect(await getA11yViolations(container)).toEqual([]);
    await user.type(amount(), '5000');
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
