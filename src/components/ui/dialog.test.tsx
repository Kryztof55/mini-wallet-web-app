import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { getA11yViolations } from '@/test/axe';
import { Button } from './button';
import { Dialog, DialogClose } from './dialog';

function CancelFlow() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="¿Cancelar la transferencia?"
      description="Se perderán los datos que capturaste."
      trigger={<Button variant="ghost">Cancelar</Button>}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="secondary">Seguir aquí</Button>
          </DialogClose>
          <Button onClick={() => setOpen(false)}>Sí, cancelar</Button>
        </>
      }
    />
  );
}

describe('[TC-COMP-01][A11Y-24] Dialog', () => {
  it('is labelled by its title and described by its description', async () => {
    render(<CancelFlow />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    const dialog = screen.getByRole('dialog', { name: '¿Cancelar la transferencia?' });
    expect(dialog).toHaveAccessibleDescription('Se perderán los datos que capturaste.');
  });

  it('moves focus inside, keeps it there, closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<CancelFlow />);
    const trigger = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    for (let i = 0; i < 4; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('returns focus to the trigger when an action closes it', async () => {
    const user = userEvent.setup();
    render(<CancelFlow />);
    const trigger = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Seguir aquí' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('has no axe violations while open', async () => {
    render(<CancelFlow />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await getA11yViolations(document.body)).toEqual([]);
  });
});
