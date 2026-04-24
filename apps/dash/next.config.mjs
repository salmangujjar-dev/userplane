/* global process */
import { withPostHogConfig } from '@posthog/nextjs-config';
import { getEnvFileName } from '@userplane/shared/env';
import dotenv from 'dotenv';

// Load environment-specific .env file based on APP_ENV
// APP_ENV=development (default) -> .env.development
// APP_ENV=production -> .env.production
// Note: override=true is needed because Next.js loads .env.development first
const appEnv = process.env.APP_ENV || 'development';
const envFile = getEnvFileName(appEnv);
dotenv.config({ path: envFile, override: true });

// Skip PostHog build instrumentation in development to speed up builds
// Enable PostHog when: production build OR POSTHOG_PERSONAL_API_KEY is set (for source map uploads)
const shouldUsePostHog = appEnv === 'production' || !!process.env.POSTHOG_PERSONAL_API_KEY;

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@userplane/ui"],
  // Allow Cloudflare tunnel origins for dev mode
  allowedDevOrigins: [
    'dash-dev.userplane.io',
  ],
  images: {
    // Use custom Cloudflare image loader for on-the-fly transforms
    // @see https://developers.cloudflare.com/images/transform-images/integrate-with-frameworks/
    loader: 'custom',
    loaderFile: './src/lib/cloudflare-image-loader.ts',
    // Remote patterns still needed for image validation
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.userplane.io',
      },
      {
        protocol: 'https',
        hostname: 'cdn-dev.userplane.io',
      },
      {
        protocol: 'https',
        hostname: 'assets.userplane.io',
      },
      {
        protocol: 'https',
        hostname: 'assets-dev.userplane.io',
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

  // Custom headers for specific routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Zendesk iframe must be frameable by Zendesk
        source: '/zendesk/iframe',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors https://*.zendesk.com',
          },
        ],
      },
    ];
  },
}

// Export with or without PostHog based on environment
// Development builds skip PostHog instrumentation for faster iteration
export default shouldUsePostHog
  ? withPostHogConfig(nextConfig, {
      personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
      projectId: process.env.POSTHOG_PROJECT_ID,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://i.userplane.io',
      sourcemaps: { enabled: true, deleteAfterUpload: true },
    })
  : nextConfig;
