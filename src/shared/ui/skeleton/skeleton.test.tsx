import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton, SkeletonGroup } from './skeleton';

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
