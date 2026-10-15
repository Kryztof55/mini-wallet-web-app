import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReceiptNotFound } from './receipt-not-found';

describe('[TC-COMP-15] Receipt not found', () => {
  it('[UIR-CONF-15][AC-CONF-17] not found: heading focused, no data, only "Ir al inicio"', () => {
    render(<ReceiptNotFound />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'No encontramos este comprobante.' }),
    ).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/');
    expect(screen.queryByText(/MW-/)).not.toBeInTheDocument();
  });
});
