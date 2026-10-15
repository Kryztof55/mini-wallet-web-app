import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getA11yViolations } from '@/test/axe';
import { emptyDraft, type ConfirmableDraft, type TransferDraft } from './state/draft';
import { SummaryStep } from './summary-step';
import { draftProbe, mxn, RECIPIENT, TransferProviders } from './test-utils';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const ready: TransferDraft = {
  ...emptyDraft,
  recipient: RECIPIENT,
  amount: mxn(25000),
  concept: 'Tacos',
};

function setup({
  draft = ready,
  hideBalance = false,
  onConfirm,
}: {
  draft?: TransferDraft;
  hideBalance?: boolean;
  onConfirm?: (draft: ConfirmableDraft) => void;
} = {}) {
  const user = userEvent.setup();
  const utils = render(
    <TransferProviders draft={draft} hideBalance={hideBalance}>
      <SummaryStep {...(onConfirm ? { onConfirm } : {})} />
    </TransferProviders>,
  );
  const value = (label: string) => {
    const term = screen.getByText(label, { selector: 'dt' });
    return term.nextElementSibling as HTMLElement;
  };
  return { ...utils, user, value };
}

beforeEach(() => {
  router.push.mockClear();
  router.replace.mockClear();
});

describe('[TC-COMP-12] Summary step', () => {
  it('[UIR-TX-16][AC-TX-01] all details, amount most prominent, resulting balance', () => {
    const { value } = setup();
    expect(screen.getByText('Paso 3 de 3 — Resumen')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Revisa tu envío' })).toHaveFocus();
    expect(value('Para')).toHaveTextContent('Luis Pérez');
    expect(within(value('Para')).getByText('celular terminación 5432')).toHaveClass('sr-only');
    expect(value('Monto')).toHaveTextContent('$250.00');
    expect(value('Concepto')).toHaveTextContent('Tacos');
    expect(value('Saldo actual')).toHaveTextContent('$1,000.00');
    expect(value('Saldo después del envío')).toHaveTextContent('$750.00');
  });

  it('[EC-01] amount equal to the balance leaves $0.00; no concept row when empty', () => {
    const { value } = setup({ draft: { ...ready, amount: mxn(100000), concept: '' } });
    expect(value('Saldo después del envío')).toHaveTextContent('$0.00');
    expect(screen.queryByText('Concepto', { selector: 'dt' })).not.toBeInTheDocument();
  });

  it('[UIR-TX-16] with the hide-balance preference, both balances are masked and can be revealed', async () => {
    const { user, value } = setup({ hideBalance: true });
    expect(value('Saldo actual')).toHaveTextContent('Saldo oculto');
    expect(value('Saldo después del envío')).toHaveTextContent('Saldo oculto');
    expect(value('Monto')).toHaveTextContent('$250.00');

    const toggle = screen.getByRole('button', { name: 'Ocultar saldo' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(value('Saldo después del envío')).toHaveTextContent('$750.00');
  });

  it('[UIR-TX-17] specific edit actions go to their step', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Cambiar destinatario' })).toHaveAttribute(
      'href',
      '/transfer/recipient',
    );
    expect(screen.getByRole('link', { name: 'Cambiar monto' })).toHaveAttribute(
      'href',
      '/transfer/amount',
    );
  });

  it('[UIR-TX-18][BR-07] confirm states the amount and hands over the draft with its attempt key', async () => {
    const onConfirm = vi.fn();
    const { user } = setup({ onConfirm });
    const key = draftProbe.current?.attempt?.key;
    expect(key).toMatch(/^[0-9a-f-]{36}$/);

    await user.click(screen.getByRole('button', { name: 'Enviar $250.00' }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: RECIPIENT,
        amount: mxn(25000),
        concept: 'Tacos',
        attempt: expect.objectContaining({ key }),
      }),
    );
  });

  it('[UIR-TX-14] without an amount it renders nothing and redirects', () => {
    setup({ draft: { ...emptyDraft, recipient: RECIPIENT } });
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(draftProbe.current?.attempt).toBeNull();
    expect(router.replace).toHaveBeenCalledWith('/transfer/amount');
  });

  it('has no axe violations', async () => {
    const { container } = setup({ hideBalance: true });
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
