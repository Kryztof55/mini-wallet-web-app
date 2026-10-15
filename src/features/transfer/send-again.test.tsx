import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Identifier } from '@/core/identifier';
import { hasTransferCompleted, markTransferCompleted } from './completion-marker';
import { SendAgain } from './send-again';
import { draftProbe, RECIPIENT, TransferProviders } from './test-utils';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeEach(() => {
  router.replace.mockClear();
  window.sessionStorage.clear();
});

describe('[TC-COMP-15][UIR-CONF-14][AC-CONF-14] "Enviar otra vez"', () => {
  it('seeds a new draft with the recipient and opens the amount step with an empty amount', () => {
    markTransferCompleted();
    render(
      <TransferProviders>
        <SendAgain recipient={RECIPIENT} />
      </TransferProviders>,
    );
    expect(draftProbe.current).toMatchObject({ recipient: RECIPIENT, amount: null, concept: '' });
    expect(router.replace).toHaveBeenCalledWith('/transfer/amount');
    expect(hasTransferCompleted()).toBe(false);
  });

  it('a one-off recipient keeps its identifier for the new transfer', () => {
    const oneOff = {
      kind: 'oneOff' as const,
      name: 'Pedro Gómez',
      identifier: { kind: 'phone', value: '5587654321' } as Identifier,
      maskedIdentifier: '•••• 4321',
    };
    render(
      <TransferProviders>
        <SendAgain recipient={oneOff} />
      </TransferProviders>,
    );
    expect(draftProbe.current?.recipient).toEqual(oneOff);
  });

  it('unknown or not owned → the flow starts at step 1', () => {
    render(
      <TransferProviders>
        <SendAgain recipient={null} />
      </TransferProviders>,
    );
    expect(draftProbe.current?.recipient).toBeNull();
    expect(router.replace).toHaveBeenCalledWith('/transfer/recipient');
  });
});
