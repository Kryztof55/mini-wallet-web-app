import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDraft, type TransferDraft } from './state/draft';
import { TransferProviders } from './test-utils';
import { useStepGuard } from './use-step-guard';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const recipient = { kind: 'contact' as const, contactId: 'c', name: 'Ana', maskedIdentifier: '•' };
const amount = { amountMinor: 100, currency: 'MXN' as const };

function guard(step: 'recipient' | 'amount' | 'summary', draft: TransferDraft) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <TransferProviders draft={draft}>{children}</TransferProviders>;
  }
  return renderHook(() => useStepGuard(step), { wrapper: Wrapper }).result.current;
}

beforeEach(() => {
  router.replace.mockClear();
  window.sessionStorage.clear();
});

describe('[TC-PL-05][UIR-TX-14][BR-03] useStepGuard', () => {
  it('amount without recipient → replaced to recipient; renders nothing meanwhile', () => {
    expect(guard('amount', emptyDraft)).toBe(false);
    expect(router.replace).toHaveBeenCalledWith('/transfer/recipient');
  });

  it('summary without amount → amount', () => {
    expect(guard('summary', { ...emptyDraft, recipient })).toBe(false);
    expect(router.replace).toHaveBeenCalledWith('/transfer/amount');
  });

  it('summary without anything → recipient (first incomplete step)', () => {
    guard('summary', emptyDraft);
    expect(router.replace).toHaveBeenCalledWith('/transfer/recipient');
  });

  it('a completed transfer → Home', () => {
    expect(guard('summary', { ...emptyDraft, recipient, amount, completed: true })).toBe(false);
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('[AC-CONF-11] Back from a receipt (completion marker) → Home, not step 1; marker consumed', () => {
    window.sessionStorage.setItem('mw.transfer.completed', '1');
    expect(guard('amount', emptyDraft)).toBe(false);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.replace).not.toHaveBeenCalledWith('/transfer/recipient');
    expect(window.sessionStorage.getItem('mw.transfer.completed')).toBeNull();
  });

  it('renders when the prerequisites are there', () => {
    expect(guard('recipient', emptyDraft)).toBe(true);
    expect(guard('amount', { ...emptyDraft, recipient })).toBe(true);
    expect(guard('summary', { ...emptyDraft, recipient, amount })).toBe(true);
    expect(router.replace).not.toHaveBeenCalled();
  });
});
