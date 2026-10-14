import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getA11yViolations } from '@/test/axe';
import { Button } from './button';

describe('[TC-COMP-01][UIR-AUTH-03][UIR-TX-13][A11Y-13] Button', () => {
  it('is a non-submitting, enabled button by default', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continuar</Button>);
    const button = screen.getByRole('button', { name: 'Continuar' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-busy');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('stays pressable with invalid input so the form can show its errors', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit} noValidate>
        <input aria-label="Monto" required />
        <Button type="submit">Continuar</Button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('busy: exposed as busy and disabled, keeps focus, shows the busy label, ignores clicks', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button onClick={onClick} busyLabel="Enviando código…">
        Continuar
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Continuar' });
    button.focus();

    rerender(
      <Button onClick={onClick} busy busyLabel="Enviando código…">
        Continuar
      </Button>,
    );

    const busy = screen.getByRole('button', { name: 'Enviando código…' });
    expect(busy).toBe(button);
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    expect(busy).toHaveFocus();
    expect(busy).not.toHaveAttribute('disabled');

    await userEvent.click(busy);
    await userEvent.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('busy without a busy label keeps the visible label as its name', () => {
    render(<Button busy>Intentar de nuevo</Button>);
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('does not submit its form while busy', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" busy>
          Verificar
        </Button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has no axe violations in any variant or state', async () => {
    const { container } = render(
      <div>
        <Button>Primario</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="ghost" size="sm">
          Terciario
        </Button>
        <Button busy busyLabel="Procesando…">
          Enviar
        </Button>
      </div>,
    );
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
