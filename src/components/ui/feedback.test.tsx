import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getA11yViolations } from '@/test/axe';
import { Button } from './button';
import { Card } from './card';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ReferenceCode } from './reference-code';
import { Skeleton, SkeletonGroup } from './skeleton';
import { StepIndicator } from './step-indicator';

const REQUEST_ID = '3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b';

describe('[TC-COMP-01][A11Y-19] Skeleton', () => {
  it('hides the shapes and exposes one busy region with a text alternative', () => {
    const { container } = render(
      <SkeletonGroup>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-24" />
      </SkeletonGroup>,
    );
    const region = container.firstElementChild;
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    expect(screen.getByText('Cargando…')).toHaveClass('sr-only');
  });
});

describe('[TC-COMP-01][UIR-CONF-11] ReferenceCode', () => {
  it('renders the short code from the request ID', () => {
    const { container } = render(<ReferenceCode requestId={REQUEST_ID} />);
    expect(container).toHaveTextContent('Referencia: 3F9A-12C4');
    expect(screen.getByText('3F9A-12C4').tagName).toBe('CODE');
  });
});

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

describe('[TC-COMP-01] EmptyState and StepIndicator', () => {
  it('EmptyState shows a heading and an action', () => {
    render(
      <EmptyState
        title="Aún no tienes movimientos"
        description="Cuando envíes o recibas dinero, aparecerá aquí."
        action={<Button>Enviar dinero</Button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Aún no tienes movimientos' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Enviar dinero' })).toBeVisible();
  });

  it('StepIndicator says where the user is in text, with a decorative bar', () => {
    const { container } = render(<StepIndicator current={2} total={3} name="Monto" />);
    expect(screen.getByText('Paso 2 de 3 — Monto')).toBeVisible();
    expect(container.querySelector('[aria-hidden="true"]')?.children).toHaveLength(3);
  });
});

describe('[TC-COMP-01] feedback components', () => {
  it('have no axe violations', async () => {
    const { container } = render(
      <main>
        <Card as="section" aria-labelledby="card-title">
          <h2 id="card-title">Saldo</h2>
          <SkeletonGroup>
            <Skeleton className="h-8 w-40" />
          </SkeletonGroup>
        </Card>
        <ErrorState title="Error" onRetry={() => undefined} requestId={REQUEST_ID} />
        <EmptyState title="Vacío" action={<Button>Acción</Button>} />
        <StepIndicator current={1} total={3} name="Destinatario" />
      </main>,
    );
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
