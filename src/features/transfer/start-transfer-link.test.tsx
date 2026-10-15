import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { hasTransferCompleted, markTransferCompleted } from './completion-marker';
import { StartTransferLink } from './start-transfer-link';

describe('[TC-PL-05][AC-CONF-11] starting a new transfer', () => {
  it('"Enviar dinero" clears the marker of the previous transfer', async () => {
    markTransferCompleted();
    render(<StartTransferLink href="/transfer/recipient">Enviar dinero</StartTransferLink>);
    const link = screen.getByRole('link', { name: 'Enviar dinero' });
    link.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(link);
    expect(hasTransferCompleted()).toBe(false);
  });
});
