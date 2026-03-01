/* global process */
import { withPostHogConfig } from '@posthog/nextjs-config'
import { getEnvFileName } from '@userplane/shared/env'
import dotenv from 'dotenv'

// Load environment-specific .env file based on APP_ENV
// APP_ENV=development (default) -> .env.development
// APP_ENV=production -> .env.production
// Note: override=true is needed because Next.js loads .env.development first
const appEnv = process.env.APP_ENV || 'development'
const envFile = getEnvFileName(appEnv)
dotenv.config({ path: envFile, override: true })

// Skip PostHog build instrumentation in development to speed up builds
const shouldUsePostHog = appEnv === 'production' || !!process.env.POSTHOG_PERSONAL_API_KEY

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@userplane/ui'],
  allowedDevOrigins: [
    'recorder-dev.userplane.io',
  ],
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudflare-image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.userplane.io' },
      { protocol: 'https', hostname: 'cdn-dev.userplane.io' },
      { protocol: 'https', hostname: 'assets.userplane.io' },
      { protocol: 'https', hostname: 'assets-dev.userplane.io' },
    ],
  },
}

export default shouldUsePostHog
  ? withPostHogConfig(nextConfig, {
      personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
      projectId: process.env.POSTHOG_PROJECT_ID,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      sourcemaps: { enabled: true, deleteAfterUpload: true },
    })
  : nextConfig
