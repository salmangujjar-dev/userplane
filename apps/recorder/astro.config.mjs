// @ts-check
/* eslint-disable no-undef */

import react from '@astrojs/react';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Skip Sentry build instrumentation in development to speed up builds
// Sentry adds significant Vite overhead even without source map uploads
// Enable Sentry when: production build OR SENTRY_AUTH_TOKEN is set (for source map uploads)
const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const shouldUseSentry = isProduction || !!process.env.SENTRY_AUTH_TOKEN;

// Sentry integration handles build-time concerns (source map uploads).
// SDK init options (dsn, environment, tracesSampleRate, beforeSend) are
// configured in sentry.client.config.ts and sentry.server.config.ts.
const sentryIntegration = shouldUseSentry
  ? sentry({
      sourceMapsUploadOptions: {
        project: process.env.SENTRY_PROJECT_RECORDER,
        org: process.env.SENTRY_ORG,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    })
  : null;

// https://astro.build/config
export default defineConfig({
  server: {
    port: 4322,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['recorder-dev.userplane.io'],
    },
  },
  integrations: [
    react(),
    // Only include Sentry in production or when auth token is set
    // Development builds skip Sentry instrumentation for faster iteration
    ...(sentryIntegration ? [sentryIntegration] : []),
  ],
});
