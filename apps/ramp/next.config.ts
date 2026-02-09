import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['ramp-dev.userplane.io'],

  // Transpile workspace packages (SDK and its transitive workspace deps)
  transpilePackages: [
    '@workspace/sdk',
    '@workspace/blurr',
    '@workspace/console-logger',
    '@workspace/metadata',
    '@workspace/postbridge',
  ],
};

export default nextConfig;
