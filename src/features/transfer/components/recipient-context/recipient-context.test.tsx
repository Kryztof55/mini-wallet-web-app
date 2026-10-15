import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecipientContext } from './recipient-context';

describe('[TC-COMP-09][UIR-TX-09] RecipientContext', () => {
  it('shows the masked identifier but gives screen readers words, plus a specific change link', () => {
    render(<RecipientContext name="Luis Pérez" maskedIdentifier="•••• 5432" />);

    expect(screen.getByText('•••• 5432')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('celular terminación 5432')).toHaveClass('sr-only');
    expect(screen.getByRole('link', { name: 'Cambiar destinatario' })).toHaveAttribute(
      'href',
      '/transfer/recipient',
    );
  });

  it('falls back to the raw text when the value is not one of our masks', () => {
    render(<RecipientContext name="Luis Pérez" maskedIdentifier="Luis" />);
    expect(screen.getAllByText('Luis')).toHaveLength(2);
  });
});
