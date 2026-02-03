// @ts-check
/* eslint-disable no-undef */

import react from '@astrojs/react';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';
import { recorderBeforeSendFilter } from '@workspace/sentry';
import { defineConfig } from 'astro/config';

// Load centralized env config for Sentry
// Note: This runs at build time, so we access process.env directly for build-time values
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const sentryConfig = {
  dsn: process.env.PUBLIC_SENTRY_DSN,
  release: process.env.PUBLIC_SENTRY_RELEASE,
  tracesSampleRate: process.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE
    ? parseFloat(process.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
    : isProduction
      ? 0.1
      : 1.0,
};

// https://astro.build/config
export default defineConfig({
  server: {
    port: 4322,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['recorder-preview.userplane.io'],
    },
  },
  integrations: [
    react(),
    sentry({
      dsn: sentryConfig.dsn,
      environment: nodeEnv,
      release: sentryConfig.release,
      tracesSampleRate: sentryConfig.tracesSampleRate,
      beforeSend: recorderBeforeSendFilter,
      sourceMapsUploadOptions: {
        project: process.env.SENTRY_PROJECT_RECORDER,
        org: process.env.SENTRY_ORG,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],
});
