import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getA11yViolations } from '@/test/axe';

describe('[SMOKE] dom test environment', () => {
  it('renders, handles user events and runs axe', async () => {
    const onClick = vi.fn();
    const { container } = render(
      <button type="button" onClick={onClick}>
        Enviar
      </button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
