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

  // Turbopack (Next.js 16 default): empty config required when webpack config
  // is present. transpilePackages + workspace linking handles source resolution.
  turbopack: {},

  // Webpack fallback: resolve workspace "source" export condition
  webpack: (config) => {
    config.resolve.conditionNames = [
      'source',
      ...(config.resolve.conditionNames ?? ['import', 'module', 'require', 'default']),
    ];
    return config;
  },
};

export default nextConfig;
