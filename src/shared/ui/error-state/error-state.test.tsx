import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './error-state';

const REQUEST_ID = '3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b';

describe('[TC-COMP-01][A11Y-11] ErrorState', () => {
  it('shows heading, description, a keyboard-reachable retry and the reference code', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="No pudimos cargar tu saldo"
        description="Revisa tu conexión."
        onRetry={onRetry}
        requestId={REQUEST_ID}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'No pudimos cargar tu saldo' }),
    ).toBeVisible();
    expect(screen.getByText('3F9A-12C4')).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('exposes the retry as busy while retrying', () => {
    render(<ErrorState title="Error" onRetry={() => undefined} retrying headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});
