import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getA11yViolations } from '@/test/axe';
import { NewContactForm } from './new-contact-form';
import { OWN } from '@/features/transfer/test-utils';
import type { SaveFieldError } from '@/features/transfer/hooks/use-save-contact';

function setup(props: { saving?: boolean; serverError?: SaveFieldError | null } = {}) {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  const utils = render(
    <NewContactForm
      ownIdentifiers={OWN}
      saving={props.saving ?? false}
      serverError={props.serverError ?? null}
      onSubmit={onSubmit}
    />,
  );
  return {
    ...utils,
    user,
    onSubmit,
    name: screen.getByLabelText('Nombre'),
    identifier: screen.getByLabelText('Celular o correo electrónico'),
    submit: () => user.click(screen.getByRole('button', { name: /Continuar|Guardando/ })),
  };
}

describe('[TC-COMP-10][UIR-TX-05] NewContactForm', () => {
  it('name, phone or email, and "Guardar en favoritos" checked by default', () => {
    setup();
    expect(screen.getByRole('checkbox', { name: 'Guardar en favoritos' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('[AC-TX-09] errors under each field; focus on the first invalid one (name)', async () => {
    const { user, name, identifier, submit, onSubmit } = setup();
    await user.type(identifier, '55123');
    await submit();
    expect(name).toHaveAccessibleDescription('Ingresa el nombre del contacto.');
    expect(identifier).toHaveAccessibleDescription(/Revisa el dato/);
    expect(name).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("[AC-TX-10][BR-09] the user's own phone or email (any format) cannot be added", async () => {
    const { user, name, identifier, submit, onSubmit } = setup();
    await user.type(name, 'Yo');
    await user.type(identifier, '+52 55 1234 5678');
    await submit();
    expect(identifier).toHaveAccessibleDescription('No puedes enviarte dinero a ti mismo.');
    expect(identifier).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a trimmed name, the normalized identifier and the save choice', async () => {
    const { user, name, identifier, submit, onSubmit } = setup();
    await user.type(name, '  Pedro Gómez ');
    await user.type(identifier, ' Pedro@Correo.com ');
    await user.click(screen.getByRole('checkbox', { name: 'Guardar en favoritos' }));
    await submit();
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Pedro Gómez',
      identifier: { kind: 'email', value: 'pedro@correo.com' },
      saveToFavorites: false,
    });
  });

  it('errors appear on blur and clear as soon as the value is valid', async () => {
    const { user, identifier } = setup();
    await user.type(identifier, '554');
    await user.tab();
    expect(identifier).toHaveAttribute('aria-invalid', 'true');
    await user.click(identifier);
    await user.type(identifier, '4443333');
    expect(identifier).not.toHaveAttribute('aria-invalid');
  });

  it('saving: "Guardando…", read-only fields, no second submit', async () => {
    const { submit, onSubmit, name } = setup({ saving: true });
    expect(screen.getByRole('button', { name: 'Guardando…' })).toHaveAttribute('aria-busy', 'true');
    expect(name).toHaveAttribute('readonly');
    await submit();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a server-side identifier error', () => {
    const { identifier } = setup({ serverError: { field: 'identifier', reason: 'self' } });
    expect(identifier).toHaveAccessibleDescription('No puedes enviarte dinero a ti mismo.');
  });

  it('has no axe violations with errors', async () => {
    const { container, submit } = setup();
    await submit();
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
