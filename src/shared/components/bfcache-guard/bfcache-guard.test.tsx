import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BfcacheGuard } from './bfcache-guard';

const reload = vi.fn();
const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  reload.mockClear();
});

function pageshow(persisted: boolean) {
  const event = new Event('pageshow') as PageTransitionEvent;
  Object.defineProperty(event, 'persisted', { value: persisted });
  window.dispatchEvent(event);
}

describe('[AC-AUTH-06][AC-AUTH-15] BfcacheGuard', () => {
  it('reloads a page restored from the back/forward cache, and only then', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    });
    const { unmount } = render(<BfcacheGuard />);
    pageshow(false);
    expect(reload).not.toHaveBeenCalled();
    pageshow(true);
    expect(reload).toHaveBeenCalledOnce();
    unmount();
    pageshow(true);
    expect(reload).toHaveBeenCalledOnce();
  });
});
