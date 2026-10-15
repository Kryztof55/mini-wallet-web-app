import { describe, expect, it } from 'vitest';
import { loginUrl } from './routes';

describe('loginUrl', () => {
  it('omits Home and empty params', () => {
    expect(loginUrl()).toBe('/login');
    expect(loginUrl({ returnTo: '/' })).toBe('/login');
  });

  it('encodes reason and returnTo', () => {
    expect(loginUrl({ returnTo: '/transfer/amount?x=1', reason: 'session_ended' })).toBe(
      '/login?reason=session_ended&returnTo=%2Ftransfer%2Famount%3Fx%3D1',
    );
  });
});
