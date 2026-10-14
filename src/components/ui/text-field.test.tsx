import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getA11yViolations } from '@/test/axe';
import { Checkbox } from './checkbox';
import { TextField } from './text-field';

describe('[TC-COMP-01][A11Y-05][A11Y-07] TextField', () => {
  it('links a visible label and hint to the input', () => {
    render(
      <TextField
        label="Celular o correo electrónico"
        hint="Celular a 10 dígitos o un correo"
        autoComplete="username"
      />,
    );
    const input = screen.getByLabelText('Celular o correo electrónico');
    expect(input).toHaveAccessibleDescription('Celular a 10 dígitos o un correo');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAttribute('autocomplete', 'username');
  });

  it('exposes the error as invalid and reads it before the hint', () => {
    render(
      <TextField
        label="Monto"
        hint="Disponible: $500.00"
        error="Ingresa un monto mayor a $0.00."
        startAdornment="$"
      />,
    );
    const input = screen.getByLabelText('Monto');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Ingresa un monto mayor a $0.00. Disponible: $500.00',
    );
    expect(input).toHaveAccessibleName('Monto');
  });

  it('includes extra descriptions passed by the caller', () => {
    render(
      <>
        <p id="balance">Saldo disponible</p>
        <TextField label="Monto" describedBy="balance" />
      </>,
    );
    expect(screen.getByLabelText('Monto')).toHaveAccessibleDescription('Saldo disponible');
  });

  it('allows typing and pasting', async () => {
    const user = userEvent.setup();
    render(<TextField label="Código de verificación" autoComplete="one-time-code" />);
    const input = screen.getByLabelText('Código de verificación');
    await user.click(input);
    await user.paste('123456');
    expect(input).toHaveValue('123456');
  });

  it('has no axe violations with and without error', async () => {
    const { container } = render(
      <div>
        <TextField label="Nombre" hint="Como aparecerá en tus contactos" />
        <TextField label="Correo" error="Revisa el correo." />
      </div>,
    );
    expect(await getA11yViolations(container)).toEqual([]);
  });
});

describe('[TC-COMP-01] Checkbox', () => {
  it('is labelled, described by its hint and toggles with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Guardar contacto" hint="Lo verás en tus favoritos" defaultChecked />);
    const checkbox = screen.getByRole('checkbox', { name: 'Guardar contacto' });
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAccessibleDescription('Lo verás en tus favoritos');

    await user.tab();
    expect(checkbox).toHaveFocus();
    await user.keyboard(' ');
    expect(checkbox).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Checkbox label="Guardar contacto" />);
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
