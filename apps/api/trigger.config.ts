import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';
import { esbuildPlugin } from '@trigger.dev/build/extensions';
import { syncEnvVars } from '@trigger.dev/build/extensions/core';
import { defineConfig } from '@trigger.dev/sdk/v3';
import { getEnvFileName } from '@workspace/shared/env';

// Build Sentry plugin if credentials are available
// Uses SENTRY_PROJECT_API for the API app's Sentry project
const sentryPlugin =
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT_API
    ? sentryEsbuildPlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT_API,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          assets: './**/*.js',
        },
      })
    : null;

/**
 * Parse a .env file into an object
 * Simple parser that handles KEY=VALUE format
 */
function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    console.warn(`[trigger.config] Env file not found: ${filePath}`);
    return {};
  }

  const content = readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes if present
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }

    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Env vars that Trigger.dev tasks need
 * Only sync what's necessary to minimize exposure
 */
const TRIGGER_ENV_KEYS = [
  // Database
  'DATABASE_URL',
  // Sentry
  'SENTRY_DSN',
  'SENTRY_ORG',
  'SENTRY_PROJECT_API',
  'SENTRY_RELEASE',
  'SENTRY_TRACES_SAMPLE_RATE',
  // Storage (R2)
  'STORAGE_PROFILE',
  'R2_CDN_ACCOUNT_ID',
  'R2_CDN_ACCESS_KEY_ID',
  'R2_CDN_SECRET_ACCESS_KEY',
  'R2_CDN_BUCKET_NAME',
  // Payments (for subscription cancellation)
  'DODO_PAYMENTS_API_KEY',
  'DODO_PAYMENTS_ENVIRONMENT',
  // General
  'NODE_ENV',
];

export default defineConfig({
  project: 'proj_zexjttpszqhvkzmtqzgx',
  runtime: 'bun',
  logLevel: 'log',
  maxDuration: 300,
  dirs: ['./src/trigger'],
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    extensions: [
      // Sync env vars from .env file during deployment
      // Reads .env.development for development, .env.production for production
      syncEnvVars(async (ctx: { environment: string; projectRef: string }) => {
        // Determine which env file to use based on deploy environment
        const envFile = getEnvFileName(ctx.environment);
        const envPath = resolve(process.cwd(), envFile);
        console.log(`[trigger.config] Syncing env vars from: ${envFile} (${ctx.environment})`);

        const allEnvVars = parseEnvFile(envPath);

        // Filter to only include what Trigger tasks need
        const filtered: Record<string, string> = {};
        for (const key of TRIGGER_ENV_KEYS) {
          if (allEnvVars[key]) {
            filtered[key] = allEnvVars[key];
          }
        }

        console.log(`[trigger.config] Syncing ${Object.keys(filtered).length} env vars`);
        return filtered;
      }),

      // Upload source maps to Sentry during deployment
      ...(sentryPlugin
        ? [
            esbuildPlugin(sentryPlugin, {
              target: 'deploy',
            }),
          ]
        : []),
    ],
  },
});
