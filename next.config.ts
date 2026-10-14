import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Type-checked <Link href> and router.push targets (TS-00 §14: types with intent).
  typedRoutes: true,
};

export default nextConfig;
