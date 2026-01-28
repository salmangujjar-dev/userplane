// @ts-check
/* eslint-disable no-undef */

import react from '@astrojs/react';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';
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
  },
  integrations: [
    react(),
    sentry({
      dsn: sentryConfig.dsn,
      environment: nodeEnv,
      release: sentryConfig.release,
      tracesSampleRate: sentryConfig.tracesSampleRate,
      // @ts-expect-error - Sentry event type
      beforeSend(event) {
        // Filter session tokens from headers
        if (event.request?.headers?.['x-userplane-session-token']) {
          event.request.headers['x-userplane-session-token'] = '[Filtered]';
        }

        // Filter Authorization headers
        if (event.request?.headers?.authorization) {
          event.request.headers.authorization = '[Filtered]';
        }

        // Filter presigned URLs from breadcrumbs and error messages
        if (event.breadcrumbs) {
          // @ts-expect-error - Sentry breadcrumb type
          event.breadcrumbs = event.breadcrumbs.map((crumb) => {
            if (crumb.message) {
              // Filter presigned URLs (S3, CloudFront, etc.)
              crumb.message = crumb.message.replace(
                /https?:\/\/[^\s]*\?(.*?X-Amz-[^&\s]*|.*?Signature=[^&\s]*)[^\s]*/gi,
                '[Presigned URL Filtered]',
              );
            }
            return crumb;
          });
        }

        // Filter sensitive data from exception messages
        if (event.exception?.values) {
          // @ts-expect-error - Sentry exception type
          event.exception.values = event.exception.values.map((exception) => {
            if (exception.value) {
              // Filter JWT tokens (basic pattern)
              exception.value = exception.value.replace(
                /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g,
                '[JWT Filtered]',
              );
              // Filter presigned URLs
              exception.value = exception.value.replace(
                /https?:\/\/[^\s]*\?(.*?X-Amz-[^&\s]*|.*?Signature=[^&\s]*)[^\s]*/gi,
                '[Presigned URL Filtered]',
              );
            }
            return exception;
          });
        }

        // Filter sensitive data from extra context
        if (event.extra) {
          const sensitiveKeys = ['token', 'sessionToken', 'presignedUrl', 'url'];
          for (const key of Object.keys(event.extra)) {
            if (
              sensitiveKeys.some((sensitive) =>
                key.toLowerCase().includes(sensitive.toLowerCase()),
              )
            ) {
              event.extra[key] = '[Filtered]';
            }
          }
        }

        return event;
      },
      sourceMapsUploadOptions: {
        project: process.env.SENTRY_PROJECT_RECORDER,
        org: process.env.SENTRY_ORG,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],
});
