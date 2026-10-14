import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getA11yViolations } from '@/test/axe';
import { IdentifierStep } from './identifier-step';

function setup(props: Partial<Parameters<typeof IdentifierStep>[0]> = {}) {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  const utils = render(
    <IdentifierStep
      defaultValue=""
      busy={false}
      serverError={null}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  const input = screen.getByLabelText('Celular o correo electrónico');
  const submit = () => user.click(screen.getByRole('button', { name: /Continuar|Enviando/ }));
  return { ...utils, user, onSubmit, input, submit };
}

describe('[TC-COMP-03][UIR-AUTH-01][UIR-AUTH-02][UIR-AUTH-03] IdentifierStep', () => {
  it('has one field for phone or email, labelled and described, with no type selector', () => {
    const { input } = setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Inicia sesión' })).toBeVisible();
    expect(input).toHaveAccessibleDescription(
      'Celular a 10 dígitos o un correo como nombre@correo.com',
    );
    expect(input).toHaveAttribute('autocomplete', 'username');
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('AC-AUTH-03: Continuar stays enabled; empty → required error, focus, no request', async () => {
    const { submit, onSubmit, input } = setup();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    await submit();
    expect(input).toHaveAccessibleDescription(/Ingresa tu celular o correo electrónico\./);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('AC-AUTH-04: format error on blur (not while typing), cleared live once valid', async () => {
    const { user, input } = setup();
    await user.type(input, '55123');
    expect(input).not.toHaveAttribute('aria-invalid');

    await user.tab();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/Revisa el dato/)).toBeVisible();

    await user.click(input);
    await user.type(input, '45678');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(/Revisa el dato/)).not.toBeInTheDocument();
  });

  it('leaving an empty field shows no error', async () => {
    const { user, input } = setup();
    await user.click(input);
    await user.tab();
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('submits a valid phone or email as typed', async () => {
    const { user, input, submit, onSubmit } = setup();
    await user.type(input, ' Ana@Correo.com ');
    await submit();
    expect(onSubmit).toHaveBeenCalledWith(' Ana@Correo.com ');
  });

  it('AC-AUTH-05: busy shows the progress label, makes the field read-only and ignores presses', async () => {
    const { submit, onSubmit, input } = setup({ busy: true, defaultValue: '5512345678' });
    const button = screen.getByRole('button', { name: 'Enviando código…' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(input).toHaveAttribute('readonly');
    await submit();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the server format error for the submitted value until it changes', async () => {
    const { rerender, user, input } = setup({ defaultValue: '5599999999' });
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    rerender(
      <IdentifierStep
        defaultValue="5599999999"
        busy={false}
        serverError="format"
        onSubmit={vi.fn()}
      />,
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await user.type(input, '1');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('keeps the identifier when coming back (AC-AUTH-11) and has no axe violations', async () => {
    const { container, input } = setup({ defaultValue: '5512345678' });
    expect(input).toHaveValue('5512345678');
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
