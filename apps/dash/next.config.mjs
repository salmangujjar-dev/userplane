/* global process */
import dotenv from 'dotenv';

import { withSentryConfig } from '@sentry/nextjs';

import { getEnvFileName } from '@workspace/shared/env';

// Load environment-specific .env file based on APP_ENV
// APP_ENV=development (default) -> .env.development
// APP_ENV=production -> .env.production
// Note: override=true is needed because Next.js loads .env.development first
const appEnv = process.env.APP_ENV || 'development';
const envFile = getEnvFileName(appEnv);
dotenv.config({ path: envFile, override: true });

// Skip Sentry build instrumentation in development to speed up builds
// Sentry adds significant webpack overhead even without source map uploads
// Enable Sentry when: production build OR SENTRY_AUTH_TOKEN is set (for source map uploads)
const shouldUseSentry = appEnv === 'production' || !!process.env.SENTRY_AUTH_TOKEN;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  // Allow Cloudflare tunnel origins for dev mode
  allowedDevOrigins: [
    'dash-dev.userplane.io',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.userplane.io',
      },
      {
        protocol: 'https',
        hostname: 'cdn-dev.userplane.io',
      },
    ],
  },
  // Webpack config for production builds (when not using Turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only packages from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'pino-pretty': false,
      };

      // Ignore pino-pretty and other server-only modules in client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'pino-pretty': 'commonjs pino-pretty',
        'thread-stream': 'commonjs thread-stream',
        'sonic-boom': 'commonjs sonic-boom',
      });
    }
    return config;
  },
  // Turbopack doesn't need the webpack externals config
  // It properly handles server-only imports out of the box
}

// Sentry config for production builds and source map uploads
// Skipped in development to avoid ~30-40s of webpack overhead
const sentryConfig = {
  // Sentry webpack plugin options
  silent: true, // Suppresses all logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_DASH,

  // Source maps upload configuration
  widenClientFileUpload: true,
  hideSourceMaps: true,

  // Webpack-specific options
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
};

// Export with or without Sentry based on environment
// Development builds skip Sentry instrumentation for faster iteration
export default shouldUseSentry
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;
