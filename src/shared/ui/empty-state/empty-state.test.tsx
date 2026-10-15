import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '@/shared/ui/button';
import { EmptyState } from './empty-state';

describe('[TC-COMP-01] EmptyState', () => {
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
});
