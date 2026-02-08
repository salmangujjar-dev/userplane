import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['ramp-dev.userplane.io'],

  // Transpile workspace packages
  transpilePackages: ['@workspace/sdk'],
};

export default nextConfig;
