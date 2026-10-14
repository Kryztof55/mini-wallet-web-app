import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('[SMOKE] GET /api/health (integration level)', () => {
  it('answers 200 and is never cached', async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
