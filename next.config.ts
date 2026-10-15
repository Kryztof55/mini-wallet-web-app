import type { NextConfig } from 'next';

/**
 * Security headers for every response (TS-00 §10). The Content-Security-Policy needs a
 * per-request nonce, so the proxy sets it on pages. No CORS headers are ever emitted
 * (ADR-004 layer 4).
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Type-checked <Link href> and router.push targets (TS-00 §14: types with intent).
  typedRoutes: true,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
