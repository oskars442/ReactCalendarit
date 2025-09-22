// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail the production build on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // (Optional) Don't fail the build on TS errors
    // You can remove this later once you fix types.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
