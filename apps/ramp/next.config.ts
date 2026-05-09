import type { NextConfig } from 'next';

type UserplaneSdkSource = 'workspace' | 'npm';

const TURBOPACK_WORKSPACE_SDK_ENTRY = '../../packages/sdk/src/index.ts';

const WORKSPACE_TRANSPILE_PACKAGES = [
  '@userplane/sdk',
  '@userplane/blurr',
  '@userplane/console-logger',
  '@userplane/metadata',
  '@userplane/postbridge',
];

function getUserplaneSdkSource(): UserplaneSdkSource {
  const defaultSource: UserplaneSdkSource =
    process.env.NODE_ENV === 'production' ? 'npm' : 'workspace';
  const source = process.env.USERPLANE_SDK_SOURCE ?? defaultSource;

  if (source !== 'workspace' && source !== 'npm') {
    throw new Error(`Invalid USERPLANE_SDK_SOURCE "${source}". Expected "workspace" or "npm".`);
  }

  return source;
}

const userplaneSdkSource = getUserplaneSdkSource();
const useWorkspaceSdk = userplaneSdkSource === 'workspace';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['ramp-dev.userplane.io'],

  // Transpile workspace packages only when Ramp is intentionally using local SDK source.
  transpilePackages: useWorkspaceSdk ? WORKSPACE_TRANSPILE_PACKAGES : [],

  // Turbopack (Next.js 16 default): keep an object here because webpack config is present.
  turbopack: useWorkspaceSdk
    ? {
        resolveAlias: {
          '@userplane/sdk': TURBOPACK_WORKSPACE_SDK_ENTRY,
        },
      }
    : {},
};

export default nextConfig;
