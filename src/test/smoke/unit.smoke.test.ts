import { describe, expect, it } from 'vitest';

describe('[SMOKE] node test environment', () => {
  it('runs without a DOM', () => {
    expect(typeof window).toBe('undefined');
  });
});
