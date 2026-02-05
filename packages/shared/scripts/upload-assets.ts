#!/usr/bin/env bun
/**
 * Media Asset Upload Script
 * Uploads assets to R2 CDN with content-hash filenames for cache-busting
 *
 * Usage:
 *   bun run scripts/upload-assets.ts [options]
 *
 * Options:
 *   --env=<env>     Load environment from apps/api/.env.<env>
 *                   (development, staging, production)
 *   --dry-run       Show what would be uploaded without actually uploading
 *   --force         Re-upload even if hash unchanged
 *   --manifest-only Generate manifest only (no upload)
 *   --verbose       Show detailed output
 *
 * Environment Variables:
 *   R2_CDN_ACCOUNT_ID       - Cloudflare account ID
 *   R2_CDN_ACCESS_KEY_ID    - R2 access key ID
 *   R2_CDN_SECRET_ACCESS_KEY - R2 secret access key
 *   R2_CDN_BUCKET_NAME      - R2 bucket name
 *   R2_CDN_PREFIX           - Top-level path prefix in R2 (default: 'media')
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// =============================================================================
// Types
// =============================================================================

type AssetCategory = 'brand' | 'tiles' | 'integrations' | 'auth' | 'intercom-canvas';

/** Valid environment names - matches packages/shared/src/env.ts */
type Environment = 'development' | 'production';

/** All valid environments for validation */
const VALID_ENVIRONMENTS: Environment[] = ['development', 'production'];

interface AssetEntry {
  /** Original path key (e.g., 'brand/logo-dark.svg') */
  key: string;
  /** Hashed path for R2 (e.g., 'brand/logo-dark.a1b2c3d4.svg') */
  hashedPath: string;
  /** Content hash (first 8 chars of SHA256) */
  hash: string;
  /** Local file path */
  localPath: string;
  /** Content type */
  contentType: string;
  /** File size in bytes */
  size: number;
}

interface UploadOptions {
  env?: Environment;
  dryRun: boolean;
  force: boolean;
  manifestOnly: boolean;
  verbose: boolean;
}

interface UploadResult {
  uploaded: AssetEntry[];
  skipped: AssetEntry[];
  errors: { entry: AssetEntry; error: string }[];
}

// =============================================================================
// Configuration
// =============================================================================

const SCRIPT_DIR = dirname(import.meta.url.replace('file://', ''));
const MONOREPO_ROOT = join(SCRIPT_DIR, '../../..');
const ASSETS_DIR = join(SCRIPT_DIR, '../assets');
const MANIFEST_PATH = join(SCRIPT_DIR, '../src/media/manifest.generated.ts');

const CATEGORIES: AssetCategory[] = ['brand', 'tiles', 'integrations', 'auth', 'intercom-canvas'];

const CONTENT_TYPE_MAP: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

const DEFAULT_R2_PREFIX = 'media';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Get R2 prefix from environment or use default
 */
function getR2Prefix(): string {
  return process.env.R2_CDN_PREFIX || DEFAULT_R2_PREFIX;
}

// =============================================================================
// Environment Loading
// =============================================================================

/**
 * Parse an .env file and return key-value pairs
 */
function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of content.split('\n')) {
    // Skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Remove inline comments
    const withoutComment = trimmed.replace(/\s*#.*$/, '');

    // Parse key=value
    const eqIndex = withoutComment.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = withoutComment.slice(0, eqIndex).trim();
    let value = withoutComment.slice(eqIndex + 1).trim();

    // Remove surrounding quotes
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
  // Try packages/shared first (local to this package)
  const sharedEnvPath = join(SCRIPT_DIR, '..', `.env.${envName}`);
  // Fall back to apps/api
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

  // Set R2_CDN_* and MEDIA_* variables
  const envVarNames = [
    'R2_CDN_ACCOUNT_ID',
    'R2_CDN_ACCESS_KEY_ID',
    'R2_CDN_SECRET_ACCESS_KEY',
    'R2_CDN_BUCKET_NAME',
    'R2_CDN_PREFIX',
    'CDN_DOMAIN',
  ];

  for (const key of envVarNames) {
    if (envVars[key]) {
      process.env[key] = envVars[key];
    }
  }

  console.log(`Loaded environment from: ${envSource}\n`);
}

// =============================================================================
// Utilities
// =============================================================================

function parseArgs(): UploadOptions {
  const args = process.argv.slice(2);
  const options: UploadOptions = {
    dryRun: false,
    force: false,
    manifestOnly: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--manifest-only') {
      options.manifestOnly = true;
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

  return options;
}

function printHelp(): void {
  console.log(`
Media Asset Upload Script

Uploads assets to R2 CDN with content-hash filenames for cache-busting.

Usage:
  bun run scripts/upload-assets.ts [options]

Options:
  --env=<env>     Load R2 credentials from .env.<env>
                  Valid values: ${VALID_ENVIRONMENTS.join(', ')}
                  Checks packages/shared/.env.<env> first, falls back to apps/api/.env.<env>
  --dry-run       Show what would be uploaded without actually uploading
  --force         Re-upload even if hash unchanged
  --manifest-only Generate manifest only (no upload, no R2 credentials needed)
  --verbose       Show detailed output
  --help, -h      Show this help message

Environment Variables (required for upload, loaded via --env or set manually):
  R2_CDN_ACCOUNT_ID        Cloudflare account ID
  R2_CDN_ACCESS_KEY_ID     R2 access key ID
  R2_CDN_SECRET_ACCESS_KEY R2 secret access key
  R2_CDN_BUCKET_NAME       R2 bucket name
  R2_CDN_PREFIX            CDN path prefix (default: 'media')
  CDN_DOMAIN               CDN base URL (for validation)

Examples:
  bun run upload-assets --env=development           # Upload using dev credentials
  bun run upload-assets --env=production            # Upload using production credentials
  bun run upload-assets --env=development --dry-run # Preview with dev credentials
  bun run upload-assets --manifest-only             # Generate manifest only (no creds needed)
`);
}

function log(message: string): void {
  console.log(message);
}

function verbose(message: string, options: UploadOptions): void {
  if (options.verbose) {
    console.log(`  ${message}`);
  }
}

function computeHash(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 8);
}

function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return CONTENT_TYPE_MAP[ext] ?? 'application/octet-stream';
}

function addHashToFilename(filename: string, hash: string): string {
  const ext = extname(filename);
  const base = basename(filename, ext);
  return `${base}.${hash}${ext}`;
}

// =============================================================================
// Asset Discovery
// =============================================================================

function discoverAssets(): AssetEntry[] {
  const entries: AssetEntry[] = [];

  for (const category of CATEGORIES) {
    const categoryDir = join(ASSETS_DIR, category);

    if (!existsSync(categoryDir)) {
      continue;
    }

    const files = readdirSync(categoryDir);

    for (const file of files) {
      const filePath = join(categoryDir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        // Handle nested directories (e.g., intercom-canvas/intercom/)
        const nestedFiles = readdirSync(filePath);
        for (const nestedFile of nestedFiles) {
          const nestedPath = join(filePath, nestedFile);
          const nestedStat = statSync(nestedPath);

          if (nestedStat.isFile()) {
            const entry = createAssetEntry(nestedPath, category, `${file}/${nestedFile}`);
            if (entry) entries.push(entry);
          }
        }
      } else if (stat.isFile()) {
        const entry = createAssetEntry(filePath, category, file);
        if (entry) entries.push(entry);
      }
    }
  }

  return entries;
}

function createAssetEntry(
  localPath: string,
  category: AssetCategory,
  filename: string
): AssetEntry | null {
  const ext = extname(filename).toLowerCase();

  // Skip non-image files
  if (!CONTENT_TYPE_MAP[ext]) {
    return null;
  }

  const content = readFileSync(localPath);
  const hash = computeHash(content);
  const hashedFilename = addHashToFilename(filename, hash);

  // Key format: 'brand/logo-dark.svg'
  const key = `${category}/${filename}`;
  // Hashed path format: 'brand/logo-dark.a1b2c3d4.svg'
  const hashedPath = `${category}/${hashedFilename}`;

  return {
    key,
    hashedPath,
    hash,
    localPath,
    contentType: getContentType(localPath),
    size: content.length,
  };
}

// =============================================================================
// Manifest Generation
// =============================================================================

function generateManifest(entries: AssetEntry[]): string {
  const mappings = entries
    .map((entry) => `  '${entry.key}': '${entry.hashedPath}'`)
    .sort()
    .join(',\n');

  return `// Auto-generated by upload-assets.ts - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

export const ASSET_MANIFEST = {
${mappings},
} as const;

export type AssetKey = keyof typeof ASSET_MANIFEST;
`;
}

function writeManifest(entries: AssetEntry[], options: UploadOptions): void {
  const content = generateManifest(entries);

  if (options.dryRun) {
    log('\n[DRY RUN] Would generate manifest:');
    log(MANIFEST_PATH);
    if (options.verbose) {
      log('\nManifest content:');
      log(content);
    }
    return;
  }

  writeFileSync(MANIFEST_PATH, content, 'utf-8');
  log(`\nGenerated manifest: ${relative(process.cwd(), MANIFEST_PATH)}`);
}

// =============================================================================
// R2 Upload
// =============================================================================

function createR2Client(): { client: S3Client; bucket: string } {
  const accountId = process.env.R2_CDN_ACCOUNT_ID;
  const accessKeyId = process.env.R2_CDN_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_CDN_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_CDN_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'Missing R2 credentials. Required environment variables:\n' +
        '  R2_CDN_ACCOUNT_ID\n' +
        '  R2_CDN_ACCESS_KEY_ID\n' +
        '  R2_CDN_SECRET_ACCESS_KEY\n' +
        '  R2_CDN_BUCKET_NAME\n\n' +
        'Use --env=<environment> to load from apps/api/.env.<environment>\n' +
        'Or set the environment variables directly.'
    );
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket };
}

async function uploadAsset(client: S3Client, bucket: string, entry: AssetEntry): Promise<void> {
  const content = readFileSync(entry.localPath);
  const key = `${getR2Prefix()}/${entry.hashedPath}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: content,
    ContentType: entry.contentType,
    CacheControl: CACHE_CONTROL,
  });

  await client.send(command);
}

async function uploadAssets(entries: AssetEntry[], options: UploadOptions): Promise<UploadResult> {
  const result: UploadResult = {
    uploaded: [],
    skipped: [],
    errors: [],
  };

  if (options.dryRun) {
    log('\n[DRY RUN] Would upload:');
    const prefix = getR2Prefix();
    for (const entry of entries) {
      log(`  ${entry.key} → ${prefix}/${entry.hashedPath}`);
    }
    result.uploaded = entries;
    return result;
  }

  const { client, bucket } = createR2Client();
  const prefix = getR2Prefix();

  log('\nUploading assets...');

  for (const entry of entries) {
    try {
      verbose(`Uploading ${entry.key}...`, options);
      await uploadAsset(client, bucket, entry);
      result.uploaded.push(entry);
      log(`  ✓ ${entry.key} → ${prefix}/${entry.hashedPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push({ entry, error: message });
      log(`  ✗ ${entry.key}: ${message}`);
    }
  }

  return result;
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.manifestOnly) {
    console.log('Media Asset Manifest Generator');
    console.log('==============================\n');
  } else {
    console.log('Media Asset Upload');
    console.log('==================');

    if (options.env) {
      loadEnvFile(options.env);
    }

    if (options.dryRun) {
      console.log('[DRY RUN] No files will be uploaded\n');
    }
  }

  // Discover all assets
  log('Discovering assets...');
  const entries = discoverAssets();

  if (entries.length === 0) {
    log('No assets found.');
    return;
  }

  log(`Found ${entries.length} assets:`);
  for (const category of CATEGORIES) {
    const categoryEntries = entries.filter((e) => e.key.startsWith(`${category}/`));
    if (categoryEntries.length > 0) {
      log(`  ${category}: ${categoryEntries.length} files`);
    }
  }

  // Upload assets (skip if manifest-only)
  let result: UploadResult = { uploaded: [], skipped: [], errors: [] };
  if (!options.manifestOnly) {
    result = await uploadAssets(entries, options);
  }

  // Generate manifest (always generate, even in manifest-only mode)
  // In manifest-only mode, we don't treat it as a dry-run for the manifest
  const manifestOptions = options.manifestOnly ? { ...options, dryRun: false } : options;
  writeManifest(entries, manifestOptions);

  // Summary
  console.log('\nSummary');
  console.log('-------');
  if (options.manifestOnly) {
    console.log(`Processed: ${entries.length} assets`);
    console.log('\nManifest generated (no upload)');
  } else {
    console.log(`Uploaded: ${result.uploaded.length} files`);
    if (result.skipped.length > 0) {
      console.log(`Skipped: ${result.skipped.length} files`);
    }
    if (result.errors.length > 0) {
      console.log(`Errors: ${result.errors.length}`);
      for (const { entry, error } of result.errors) {
        console.error(`  ${entry.key}: ${error}`);
      }
      process.exit(1);
    }

    if (options.dryRun) {
      console.log('\nRun without --dry-run to upload assets');
    } else {
      console.log('\nDone!');
    }
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
