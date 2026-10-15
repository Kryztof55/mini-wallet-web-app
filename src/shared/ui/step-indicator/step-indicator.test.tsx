import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StepIndicator } from './step-indicator';

describe('[TC-COMP-01] StepIndicator', () => {
  it('StepIndicator says where the user is in text, with a decorative bar', () => {
    const { container } = render(<StepIndicator current={2} total={3} name="Monto" />);
    expect(screen.getByText('Paso 2 de 3 — Monto')).toBeVisible();
    expect(container.querySelector('[aria-hidden="true"]')?.children).toHaveLength(3);
  });
});
