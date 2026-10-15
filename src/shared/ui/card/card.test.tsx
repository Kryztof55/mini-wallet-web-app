import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getA11yViolations } from '@/test/axe';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { Skeleton, SkeletonGroup } from '@/shared/ui/skeleton';
import { StepIndicator } from '@/shared/ui/step-indicator';
import { Card } from './card';

const REQUEST_ID = '3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b';

describe('[TC-COMP-01] Card with the feedback components', () => {
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
