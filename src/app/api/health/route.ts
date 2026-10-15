import { NextResponse } from 'next/server';

/**
 * Liveness probe used by the E2E web server readiness check and by operators.
 * Public, safe (GET, no state), never cached.
 */
export function GET(): NextResponse<{ status: 'ok' }> {
  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
