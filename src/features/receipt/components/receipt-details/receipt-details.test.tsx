import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/ui/toast';
import { HideBalanceProvider } from '@/shared/components/hide-balance';
import { hasTransferCompleted, markTransferCompleted } from '@/shared/lib/transfer-completion';
import { getA11yViolations } from '@/test/axe';
import type { ReceiptView } from '@/shared/api/transfers';
import { CopyFolioButton } from '@/features/receipt/components/copy-folio-button';
import { ReceiptDetails, spelledOut } from './receipt-details';

const RECEIPT: ReceiptView = {
  transferId: 'trf_1',
  folio: 'MW-7K3P9Q',
  amount: { amountMinor: 25000, currency: 'MXN' },
  recipient: { name: 'Luis Pérez', maskedIdentifier: '•••• 5432' },
  concept: 'Tacos',
  completedAt: '2026-10-14T20:32:00.000Z',
  balanceAfter: { amountMinor: 75000, currency: 'MXN' },
};

function Providers({ hidden = false, children }: { hidden?: boolean; children: ReactNode }) {
  return (
    <ToastProvider>
      <HideBalanceProvider initialHidden={hidden}>{children}</HideBalanceProvider>
    </ToastProvider>
  );
}

function setup(receipt: ReceiptView = RECEIPT, hidden = false) {
  const user = userEvent.setup();
  const utils = render(
    <Providers hidden={hidden}>
      <ReceiptDetails receipt={receipt} completedAt="14 de octubre de 2026, 14:32" />
    </Providers>,
  );
  const value = (label: string) =>
    screen.getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;
  return { ...utils, user, value };
}

beforeEach(() => window.sessionStorage.clear());

describe('[TC-COMP-15] Receipt', () => {
  it('[UIR-CONF-12][AC-CONF-01] all fields; success heading focused', () => {
    const { value } = setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Envío realizado' })).toHaveFocus();
    expect(screen.getByText('$250.00')).toBeVisible();
    expect(screen.getByText(/a Luis Pérez/)).toBeVisible();
    expect(screen.getByText('celular terminación 5432')).toHaveClass('sr-only');
    expect(value('Concepto')).toHaveTextContent('Tacos');
    expect(value('Fecha y hora')).toHaveTextContent('14 de octubre de 2026, 14:32');
    expect(value('Estado')).toHaveTextContent('Completado');
    expect(value('Folio')).toHaveTextContent('MW-7K3P9Q');
    expect(value('Saldo disponible')).toHaveTextContent('$750.00');
  });

  it('[A11Y-17] the folio is spelled out to assistive technology', () => {
    const { value } = setup();
    expect(spelledOut('MW-7K3P9Q')).toBe('M W - 7 K 3 P 9 Q');
    expect(within(value('Folio')).getByText('M W - 7 K 3 P 9 Q')).toHaveClass('sr-only');
    expect(within(value('Folio')).getByText('MW-7K3P9Q')).toHaveAttribute('aria-hidden', 'true');
  });

  it('no concept → no concept row', () => {
    setup({ ...RECEIPT, concept: null });
    expect(screen.queryByText('Concepto', { selector: 'dt' })).not.toBeInTheDocument();
  });

  it('[EC-08] balance masked with the hide-balance preference, with a reveal control', async () => {
    const { value, user } = setup(RECEIPT, true);
    expect(value('Saldo disponible')).toHaveTextContent('Saldo oculto');
    expect(value('Saldo disponible')).not.toHaveTextContent('$750.00');
    await user.click(screen.getByRole('button', { name: 'Ocultar saldo' }));
    expect(value('Saldo disponible')).toHaveTextContent('$750.00');
  });

  it('[UIR-CONF-13][AC-CONF-13] "Copiar folio" copies it and announces "Folio copiado"', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Copiar folio' }));
    expect(await navigator.clipboard.readText()).toBe('MW-7K3P9Q');
    expect(await screen.findByText('Folio copiado')).toBeVisible();
  });

  it('clipboard unavailable → says so, the folio stays on screen', async () => {
    const user = userEvent.setup();
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error('denied')) };
    render(
      <Providers>
        <CopyFolioButton folio="MW-7K3P9Q" clipboard={clipboard} />
      </Providers>,
    );
    await user.click(screen.getByRole('button', { name: 'Copiar folio' }));
    expect(
      await screen.findByText('No pudimos copiar el folio. Selecciónalo para copiarlo.'),
    ).toBeVisible();
  });

  it('[UIR-CONF-14][UIR-HOME-11] actions: "Ir al inicio" first (highlights the movement), then "Enviar otra vez"', () => {
    setup();
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Ir al inicio', 'Enviar otra vez']);
    expect(links[0]).toHaveAttribute('href', '/?highlight=trf_1');
    expect(links[1]).toHaveAttribute('href', '/transfer/again/trf_1');
  });

  it('[AC-CONF-14] "Enviar otra vez" clears the completion marker (starts a new flow)', async () => {
    markTransferCompleted();
    const { user } = setup();
    const again = screen.getByRole('link', { name: 'Enviar otra vez' });
    again.addEventListener('click', (event) => event.preventDefault());
    await user.click(again);
    expect(hasTransferCompleted()).toBe(false);
  });

  it('has no axe violations (shown and hidden balance)', async () => {
    const { container, user } = setup();
    expect(await getA11yViolations(container)).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Ocultar saldo' }));
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
