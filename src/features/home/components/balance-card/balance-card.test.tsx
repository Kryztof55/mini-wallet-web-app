import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Money } from '@/core/money';
import { HideBalanceProvider } from '@/shared/components/hide-balance';
import { getA11yViolations } from '@/test/axe';
import { BalanceCard } from './balance-card';

const mxn = (amountMinor: number): Money => ({ amountMinor, currency: 'MXN' });

function setup(amountMinor: number, hidden = false) {
  return render(
    <HideBalanceProvider initialHidden={hidden}>
      <BalanceCard balance={mxn(amountMinor)} />
    </HideBalanceProvider>,
  );
}

describe('[TC-COMP-06][UIR-HOME-04][UIR-HOME-05][AC-HOME-10] BalanceCard and HideBalanceToggle', () => {
  it('shows the balance with es-MX formatting and no zero note', () => {
    setup(1234567);
    expect(screen.getByText('$12,345.67')).toBeVisible();
    expect(screen.queryByText('No tienes saldo disponible')).not.toBeInTheDocument();
  });

  it('AC-HOME-10: zero balance shows $0.00 and the note', () => {
    setup(0);
    expect(screen.getByText('$0.00')).toBeVisible();
    expect(screen.getByText('No tienes saldo disponible')).toBeVisible();
  });

  it('the toggle exposes its pressed state and masks the balance as "Saldo oculto"', async () => {
    setup(1234567);
    const toggle = screen.getByRole('button', { name: 'Ocultar saldo' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveFocus();
    expect(screen.queryByText('$12,345.67')).not.toBeInTheDocument();
    expect(screen.getByText('$ ••••••')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Saldo oculto')).toHaveClass('sr-only');
  });

  it('renders masked on first paint when the preference is on', () => {
    setup(1234567, true);
    expect(screen.getByText('Saldo oculto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar saldo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('has no axe violations', async () => {
    const { container } = setup(0);
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
