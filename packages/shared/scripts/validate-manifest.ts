#!/usr/bin/env bun
/**
 * Manifest Validation Script
 * Validates that assets in the manifest exist locally and/or on the CDN
 *
 * Usage:
 *   bun run scripts/validate-manifest.ts [options]
 *
 * Options:
 *   --local         Check assets exist in packages/shared/assets/
 *   --remote        Check assets exist on CDN via HTTP HEAD requests
 *   --env=<env>     Load CDN URL from .env.<env> (for remote validation)
 *                   (development, staging, preview, production)
 *   --verbose       Show detailed output
 *   --help, -h      Show this help message
 *
 * Environment Variables (for remote validation):
 *   CDN_DOMAIN  - CDN base URL (default: https://cdn.userplane.io)
 *   R2_CDN_PREFIX - CDN prefix (default: media)
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// =============================================================================
// Types
// =============================================================================

/** Valid environment names - matches packages/shared/src/env.ts */
type Environment = 'development' | 'production';

/** All valid environments for validation */
const VALID_ENVIRONMENTS: Environment[] = ['development', 'production'];

interface ValidateOptions {
  local: boolean;
  remote: boolean;
  env?: Environment;
  verbose: boolean;
}

interface ValidationResult {
  local: {
    passed: string[];
    failed: string[];
  };
  remote: {
    passed: string[];
    failed: string[];
  };
}

// =============================================================================
// Configuration
// =============================================================================

const SCRIPT_DIR = dirname(import.meta.url.replace('file://', ''));
const MONOREPO_ROOT = join(SCRIPT_DIR, '../../..');
const ASSETS_DIR = join(SCRIPT_DIR, '../assets');
const MANIFEST_PATH = join(SCRIPT_DIR, '../src/media/manifest.generated.ts');

const DEFAULTS = {
  CDN_BASE_URL: 'https://cdn.userplane.io',
  CDN_PREFIX: 'media',
} as const;

// =============================================================================
// Environment Loading
// =============================================================================

/**
 * Parse an .env file and return key-value pairs
 */
function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const withoutComment = trimmed.replace(/\s*#.*$/, '');
    const eqIndex = withoutComment.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = withoutComment.slice(0, eqIndex).trim();
    let value = withoutComment.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

/**
 * Load environment variables from a .env file
 * Checks packages/shared/.env.<env> first, then falls back to apps/api/.env.<env>
 */
function loadEnvFile(envName: Environment): void {
  const sharedEnvPath = join(SCRIPT_DIR, '..', `.env.${envName}`);
  const apiEnvPath = join(MONOREPO_ROOT, 'apps/api', `.env.${envName}`);

  let envPath: string;
  let envSource: string;

  if (existsSync(sharedEnvPath)) {
    envPath = sharedEnvPath;
    envSource = `packages/shared/.env.${envName}`;
  } else if (existsSync(apiEnvPath)) {
    envPath = apiEnvPath;
    envSource = `apps/api/.env.${envName}`;
  } else {
    console.error(`Error: Environment file not found.`);
    console.error(`  Checked: packages/shared/.env.${envName}`);
    console.error(`  Checked: apps/api/.env.${envName}`);
    console.error(`\nRun 'make env:setup' to create environment files.`);
    process.exit(1);
  }

  const content = readFileSync(envPath, 'utf-8');
  const envVars = parseEnvFile(content);

  // Set CDN URL construction variables
  const envVarNames = ['CDN_DOMAIN', 'R2_CDN_PREFIX'];

  for (const key of envVarNames) {
    if (envVars[key]) {
      process.env[key] = envVars[key];
    }
  }

  console.log(`Loaded environment from: ${envSource}\n`);
}

// =============================================================================
// Manifest Loading
// =============================================================================

/**
 * Load and parse the asset manifest
 * Returns a map of original paths to hashed paths
 */
function loadManifest(): Record<string, string> {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`Error: Manifest file not found: ${MANIFEST_PATH}`);
    console.error(`\nRun 'bun run assets:manifest' to generate the manifest.`);
    process.exit(1);
  }

  const content = readFileSync(MANIFEST_PATH, 'utf-8');

  // Parse the manifest using regex to extract the object
  const match = content.match(/export const ASSET_MANIFEST = \{([^}]+)\}/s);
  if (!match || !match[1]) {
    console.error('Error: Could not parse manifest file');
    process.exit(1);
  }

  const manifestContent = match[1];
  const entries = manifestContent.matchAll(/'([^']+)': '([^']+)'/g);
  const manifest: Record<string, string> = {};

  for (const entry of entries) {
    const key = entry[1];
    const value = entry[2];
    if (key && value) {
      manifest[key] = value;
    }
  }

  return manifest;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate that local asset files exist
 */
function validateLocal(
  manifest: Record<string, string>,
  verbose: boolean
): ValidationResult['local'] {
  const result = { passed: [] as string[], failed: [] as string[] };

  for (const key of Object.keys(manifest)) {
    const localPath = join(ASSETS_DIR, key);

    if (existsSync(localPath)) {
      result.passed.push(key);
      if (verbose) {
        console.log(`  [OK] ${key}`);
      }
    } else {
      result.failed.push(key);
      console.log(`  [MISSING] ${key}`);
    }
  }

  return result;
}

/**
 * Validate that remote assets exist on the CDN
 */
async function validateRemote(
  manifest: Record<string, string>,
  verbose: boolean
): Promise<ValidationResult['remote']> {
  const result = { passed: [] as string[], failed: [] as string[] };

  const cdnBaseUrl = process.env.CDN_DOMAIN || DEFAULTS.CDN_BASE_URL;
  const cdnPrefix = process.env.R2_CDN_PREFIX || DEFAULTS.CDN_PREFIX;
  const cdnUrl = `${cdnBaseUrl}/${cdnPrefix}`;

  console.log(`CDN URL: ${cdnUrl}\n`);

  // Process in batches to avoid overwhelming the server
  const entries = Object.entries(manifest);
  const batchSize = 10;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async ([key, hashedPath]) => {
        const url = `${cdnUrl}/${hashedPath}`;

        try {
          const response = await fetch(url, { method: 'HEAD' });

          if (response.ok) {
            result.passed.push(key);
            if (verbose) {
              console.log(`  [OK] ${key} -> ${hashedPath}`);
            }
          } else {
            result.failed.push(key);
            console.log(`  [${response.status}] ${key} -> ${hashedPath}`);
          }
        } catch (error) {
          result.failed.push(key);
          const message = error instanceof Error ? error.message : String(error);
          console.log(`  [ERROR] ${key}: ${message}`);
        }
      })
    );
  }

  return result;
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): ValidateOptions {
  const args = process.argv.slice(2);
  const options: ValidateOptions = {
    local: false,
    remote: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg === '--local') {
      options.local = true;
    } else if (arg === '--remote') {
      options.remote = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--env=')) {
      const envValue = arg.slice(6) as Environment;
      if (!VALID_ENVIRONMENTS.includes(envValue)) {
        console.error(`Invalid environment: ${envValue}`);
        console.error(`Valid options: ${VALID_ENVIRONMENTS.join(', ')}`);
        process.exit(1);
      }
      options.env = envValue;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown option: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }

  // Default to local validation if nothing specified
  if (!options.local && !options.remote) {
    options.local = true;
  }

  return options;
}

function printHelp(): void {
  console.log(`
Manifest Validation Script

Validates that assets in the manifest exist locally and/or on the CDN.

Usage:
  bun run scripts/validate-manifest.ts [options]

Options:
  --local         Check assets exist in packages/shared/assets/
  --remote        Check assets exist on CDN via HTTP HEAD requests
  --env=<env>     Load CDN URL from .env.<env> (for remote validation)
                  Valid values: ${VALID_ENVIRONMENTS.join(', ')}
                  Checks packages/shared/.env.<env> first, falls back to apps/api/.env.<env>
  --verbose       Show detailed output (including passed checks)
  --help, -h      Show this help message

Environment Variables (for remote validation):
  CDN_DOMAIN          CDN base URL (default: ${DEFAULTS.CDN_BASE_URL})
  R2_CDN_PREFIX       CDN prefix (default: ${DEFAULTS.CDN_PREFIX})

Examples:
  bun run validate-manifest --local                    # Check local files exist
  bun run validate-manifest --remote --env=development # Check CDN (dev env)
  bun run validate-manifest --remote --env=staging     # Check CDN (staging env)
  bun run validate-manifest --remote --env=preview     # Check CDN (preview env)
  bun run validate-manifest --remote --env=production  # Check CDN (production env)
  bun run validate-manifest --local --remote --env=development --verbose
`);
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  console.log('Manifest Validation');
  console.log('===================\n');

  // Load environment if specified
  if (options.env) {
    loadEnvFile(options.env);
  }

  // Load manifest
  const manifest = loadManifest();
  console.log(`Found ${Object.keys(manifest).length} assets in manifest\n`);

  const result: ValidationResult = {
    local: { passed: [], failed: [] },
    remote: { passed: [], failed: [] },
  };

  // Local validation
  if (options.local) {
    console.log('Local Validation');
    console.log('----------------');
    result.local = validateLocal(manifest, options.verbose);
    console.log();
  }

  // Remote validation
  if (options.remote) {
    console.log('Remote Validation');
    console.log('-----------------');
    result.remote = await validateRemote(manifest, options.verbose);
    console.log();
  }

  // Summary
  console.log('Summary');
  console.log('-------');

  let hasFailures = false;

  if (options.local) {
    const { passed, failed } = result.local;
    console.log(`Local:  ${passed.length} passed, ${failed.length} failed`);
    if (failed.length > 0) {
      hasFailures = true;
    }
  }

  if (options.remote) {
    const { passed, failed } = result.remote;
    console.log(`Remote: ${passed.length} passed, ${failed.length} failed`);
    if (failed.length > 0) {
      hasFailures = true;
    }
  }

  if (hasFailures) {
    console.log('\nValidation FAILED');
    process.exit(1);
  } else {
    console.log('\nValidation PASSED');
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
