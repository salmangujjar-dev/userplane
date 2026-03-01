import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['ramp-dev.userplane.io'],
  serverExternalPackages: ['better-sqlite3'],

  // Transpile workspace packages (SDK and its transitive workspace deps)
  transpilePackages: [
    '@userplane/sdk',
    '@userplane/blurr',
    '@userplane/console-logger',
    '@userplane/metadata',
    '@userplane/postbridge',
  ],
};

export default nextConfig;
