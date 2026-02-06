import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';
// import { esbuildPlugin } from '@trigger.dev/build/extensions';
import { syncEnvVars } from '@trigger.dev/build/extensions/core';
import { defineConfig } from '@trigger.dev/sdk/v3';
import { getEnvFileName } from '@workspace/shared/env';

// Sentry esbuild plugin disabled: causes source-map error with bun runtime
// during trigger.dev indexing. See comment in build.extensions below.
// const sentryPlugin =
//   process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT_API
//     ? sentryEsbuildPlugin({
//         org: process.env.SENTRY_ORG,
//         project: process.env.SENTRY_PROJECT_API,
//         authToken: process.env.SENTRY_AUTH_TOKEN,
//         sourcemaps: {
//           assets: './**/*.js',
//         },
//       })
//     : null;

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
 * Env vars to sync to Trigger.dev task workers.
 *
 * Trigger tasks import the full env config (src/env/index.ts), which eagerly
 * validates ALL env vars via rawEnvSchema. Every requiredString/requiredUrl
 * field must be present or the env parse fails at task import time.
 *
 * When adding new required env vars to the schema, add them here too.
 */
const TRIGGER_ENV_KEYS = [
  // General
  'NODE_ENV',
  // Database
  'DATABASE_URL',
  // Auth (required by authEnvSchema)
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_COOKIE_DOMAIN',
  // Payments (both required by paymentsEnvSchema)
  'DODO_PAYMENTS_API_KEY',
  'DODO_PAYMENTS_WEBHOOK_SECRET',
  'DODO_PAYMENTS_ENVIRONMENT',
  // Redis (both required by redisEnvSchema)
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  // Secrets (validated against dev defaults in production)
  'INVITE_TOKEN_SECRET',
  'SESSION_TOKEN_SECRET',
  'UPLOAD_TOKEN_SECRET',
  'RECORDER_TOKEN_SECRET',
  // Trigger (TRIGGER_SECRET_KEY is required by triggerEnvSchema)
  'TRIGGER_SECRET_KEY',
  // Storage domains (both required by storageEnvSchema)
  'ASSETS_DOMAIN',
  'CDN_DOMAIN',
  // Storage (R2) - all required by storageEnvSchema
  'R2_CDN_ACCOUNT_ID',
  'R2_CDN_ACCESS_KEY_ID',
  'R2_CDN_SECRET_ACCESS_KEY',
  'R2_CDN_BUCKET_NAME',
  'R2_ASSETS_ACCOUNT_ID',
  'R2_ASSETS_ACCESS_KEY_ID',
  'R2_ASSETS_SECRET_ACCESS_KEY',
  'R2_ASSETS_BUCKET_NAME',
  'R2_REPORTS_ACCOUNT_ID',
  'R2_REPORTS_ACCESS_KEY_ID',
  'R2_REPORTS_SECRET_ACCESS_KEY',
  'R2_REPORTS_BUCKET_NAME',
  // Sentry (used by init.ts runtime error tracking)
  'SENTRY_DSN',
  'SENTRY_RELEASE',
  'SENTRY_TRACES_SAMPLE_RATE',
];

export default defineConfig({
  project: 'proj_pftbudrujxtzedzxhqlg',
  // bun runtime is experimental and causes source-map errors during indexing.
  // Switch to node-22 until trigger.dev stabilizes bun support.
  runtime: 'node-22',
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

      // Sentry esbuild plugin disabled: causes "Column must be greater than or
      // equal to 0" source-map error during trigger.dev indexing due to bun
      // runtime + source-map-support incompatibility. The plugin also finds 0
      // source map files to upload. Re-enable once trigger.dev resolves the
      // bun source map issue.
      // ...(sentryPlugin
      //   ? [
      //       esbuildPlugin(sentryPlugin, {
      //         target: 'deploy',
      //       }),
      //     ]
      //   : []),
    ],
  },
});
