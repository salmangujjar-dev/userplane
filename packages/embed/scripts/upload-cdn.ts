#!/usr/bin/env bun
/**
 * Embed CDN Upload Script
 *
 * Uploads embed assets to R2 CDN with content-hash filenames for cache-busting.
 * Follows the Birdie pattern: stable bootstrap URL + content-addressed main code.
 *
 * Usage:
 *   bun run scripts/upload-cdn.ts [options]
 *
 * Options:
 *   --env=<env>     Load environment from apps/api/.env.<env>
 *   --dry-run       Show what would be uploaded without actually uploading
 *   --force         Re-upload even if hash unchanged
 *   --manifest-only Generate manifest only (no upload)
 *   --verbose       Show detailed output
 *
 * Environment Variables:
 *   R2_CDN_ACCOUNT_ID        - Cloudflare account ID
 *   R2_CDN_ACCESS_KEY_ID     - R2 access key ID
 *   R2_CDN_SECRET_ACCESS_KEY - R2 secret access key
 *   R2_CDN_BUCKET_NAME       - R2 bucket name
 *   CDN_DOMAIN               - CDN domain (for verification)
 *   R2_CDN_PREFIX             - CDN prefix path (default: 'embed')
 */

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// =============================================================================
// Types
// =============================================================================

type Environment = 'development' | 'production';

const VALID_ENVIRONMENTS: Environment[] = ['development', 'production'];

interface UploadOptions {
  env?: Environment;
  dryRun: boolean;
  force: boolean;
  manifestOnly: boolean;
  verbose: boolean;
}

interface ManifestData {
  'main.js': string;
  version: string;
  timestamp: string;
  contentHash: string;
}

interface UploadResult {
  uploaded: string[];
  skipped: string[];
  errors: { file: string; error: string }[];
}

// =============================================================================
// Configuration
// =============================================================================

const SCRIPT_DIR = dirname(import.meta.url.replace('file://', ''));
const PACKAGE_DIR = join(SCRIPT_DIR, '..');
const MONOREPO_ROOT = join(PACKAGE_DIR, '../..');
const DIST_DIR = join(PACKAGE_DIR, 'dist');
const PACKAGE_JSON_PATH = join(PACKAGE_DIR, 'package.json');

// R2 path prefix for embed files
const R2_PREFIX = 'embed';

// Cache control settings (Birdie pattern)
const CACHE_CONTROL = {
  // Bootstrap and manifest: short cache (5 min) to allow updates
  mutable: 'public, max-age=300',
  // Content-addressed files: immutable (1 year)
  immutable: 'public, max-age=31536000, immutable',
};

// =============================================================================
// Environment Loading
// =============================================================================

function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const withoutComment = trimmed.replace(/\s*#.*$/, '');
    const eqIndex = withoutComment.indexOf('=');
    if (eqIndex === -1) continue;

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

function loadEnvFile(envName: Environment): void {
  // Try packages/embed first, then apps/api
  const embedEnvPath = join(PACKAGE_DIR, `.env.${envName}`);
  const apiEnvPath = join(MONOREPO_ROOT, 'apps/api', `.env.${envName}`);

  let envPath: string;
  let envSource: string;

  if (existsSync(embedEnvPath)) {
    envPath = embedEnvPath;
    envSource = `packages/embed/.env.${envName}`;
  } else if (existsSync(apiEnvPath)) {
    envPath = apiEnvPath;
    envSource = `apps/api/.env.${envName}`;
  } else {
    console.error(`Error: Environment file not found.`);
    console.error(`  Checked: packages/embed/.env.${envName}`);
    console.error(`  Checked: apps/api/.env.${envName}`);
    process.exit(1);
  }

  const content = readFileSync(envPath, 'utf-8');
  const envVars = parseEnvFile(content);

  // Load R2_CDN_* and CDN_* variables
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
Embed CDN Upload Script

Uploads embed assets to R2 CDN with content-hash filenames.

Usage:
  bun run scripts/upload-cdn.ts [options]

Options:
  --env=<env>     Load R2 credentials from .env.<env>
                  Valid values: ${VALID_ENVIRONMENTS.join(', ')}
  --dry-run       Show what would be uploaded without actually uploading
  --force         Re-upload even if hash unchanged
  --manifest-only Generate manifest only (no upload, no R2 credentials needed)
  --verbose       Show detailed output
  --help, -h      Show this help message

Examples:
  bun run upload:cdn --env=development           # Upload using dev credentials
  bun run upload:cdn --env=production            # Upload using production credentials
  bun run upload:cdn --env=development --dry-run # Preview upload
  bun run upload:cdn --manifest-only             # Generate manifest only
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

function computeHash(content: Buffer | string, length = 16): string {
  return createHash('sha256').update(content).digest('hex').slice(0, length);
}

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// =============================================================================
// Build Verification
// =============================================================================

function verifyBuild(): { mainPath: string; scriptPath: string } {
  const mainPath = join(DIST_DIR, 'main.js');
  const scriptPath = join(DIST_DIR, 'script.js');

  if (!existsSync(mainPath)) {
    console.error('Error: dist/main.js not found.');
    console.error('Run "bun run build:cdn" first.');
    process.exit(1);
  }

  if (!existsSync(scriptPath)) {
    console.error('Error: dist/script.js not found.');
    console.error('Run "bun run build:cdn" first.');
    process.exit(1);
  }

  return { mainPath, scriptPath };
}

// =============================================================================
// Content-Addressed Files
// =============================================================================

function createContentAddressedFile(
  sourcePath: string,
  options: UploadOptions
): { hashedPath: string; hashedFilename: string; hash: string } {
  const content = readFileSync(sourcePath);
  const hash = computeHash(content);
  const hashedFilename = `main.${hash}.js`;
  const hashedPath = join(DIST_DIR, hashedFilename);

  if (options.dryRun) {
    log(`[DRY RUN] Would create: ${hashedFilename}`);
  } else {
    copyFileSync(sourcePath, hashedPath);
    log(`Created: ${hashedFilename}`);
  }

  return { hashedPath, hashedFilename, hash };
}

// =============================================================================
// Manifest Generation
// =============================================================================

function generateManifest(
  hashedFilename: string,
  hash: string,
  options: UploadOptions
): ManifestData {
  const manifest: ManifestData = {
    'main.js': hashedFilename,
    version: getVersion(),
    timestamp: new Date().toISOString(),
    contentHash: hash,
  };

  const manifestPath = join(DIST_DIR, 'manifest.json');

  if (options.dryRun) {
    log(`[DRY RUN] Would generate manifest:`);
    log(JSON.stringify(manifest, null, 2));
  } else {
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    log(`Generated: manifest.json`);
  }

  return manifest;
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
        'Use --env=<environment> to load from .env file\n' +
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

async function uploadFile(
  client: S3Client,
  bucket: string,
  localPath: string,
  r2Key: string,
  cacheControl: string,
  options: UploadOptions
): Promise<void> {
  // Early return before reading files — in dry-run mode, content-addressed
  // and manifest files are not created on disk.
  if (options.dryRun) {
    log(`[DRY RUN] Would upload: ${r2Key}`);
    verbose(`  Cache-Control: ${cacheControl}`, options);
    return;
  }

  const content = readFileSync(localPath);
  const contentType = r2Key.endsWith('.json')
    ? 'application/json; charset=utf-8'
    : 'application/javascript; charset=utf-8';

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: r2Key,
    Body: content,
    ContentType: contentType,
    CacheControl: cacheControl,
  });

  await client.send(command);
  log(`Uploaded: ${r2Key}`);
  verbose(`  Cache-Control: ${cacheControl}`, options);
}

async function uploadAssets(hashedFilename: string, options: UploadOptions): Promise<UploadResult> {
  const result: UploadResult = {
    uploaded: [],
    skipped: [],
    errors: [],
  };

  const { client, bucket } = createR2Client();

  const filesToUpload = [
    {
      local: join(DIST_DIR, 'script.js'),
      r2Key: `${R2_PREFIX}/script.js`,
      cacheControl: CACHE_CONTROL.mutable,
    },
    {
      local: join(DIST_DIR, 'manifest.json'),
      r2Key: `${R2_PREFIX}/manifest.json`,
      cacheControl: CACHE_CONTROL.mutable,
    },
    {
      local: join(DIST_DIR, hashedFilename),
      r2Key: `${R2_PREFIX}/${hashedFilename}`,
      cacheControl: CACHE_CONTROL.immutable,
    },
  ];

  // Discover any additional chunk files produced by Vite (content-hashed .js files)
  const knownFiles = new Set(filesToUpload.map((f) => f.local));
  for (const file of readdirSync(DIST_DIR)) {
    const fullPath = join(DIST_DIR, file);
    if (file.endsWith('.js') && !knownFiles.has(fullPath)) {
      filesToUpload.push({
        local: fullPath,
        r2Key: `${R2_PREFIX}/${file}`,
        cacheControl: CACHE_CONTROL.immutable,
      });
    }
  }

  log('\nUploading to R2...');

  for (const file of filesToUpload) {
    try {
      await uploadFile(client, bucket, file.local, file.r2Key, file.cacheControl, options);
      result.uploaded.push(file.r2Key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push({ file: file.r2Key, error: message });
      log(`Error uploading ${file.r2Key}: ${message}`);
    }
  }

  return result;
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  console.log('Embed CDN Upload');
  console.log('================');

  if (options.manifestOnly) {
    console.log('Mode: Manifest only (no upload)\n');
  } else if (options.dryRun) {
    console.log('[DRY RUN] No files will be uploaded\n');
  }

  // Load environment if specified
  if (options.env) {
    loadEnvFile(options.env);
  }

  // Verify build exists
  log('Verifying build...');
  const { mainPath, scriptPath } = verifyBuild();

  const mainSize = readFileSync(mainPath).length;
  const scriptSize = readFileSync(scriptPath).length;

  log(`  script.js: ${(scriptSize / 1024).toFixed(2)} KB`);
  log(`  main.js: ${(mainSize / 1024).toFixed(2)} KB`);

  // Create content-addressed file
  log('\nCreating content-addressed file...');
  const { hashedFilename, hash } = createContentAddressedFile(mainPath, options);

  // Generate manifest
  log('\nGenerating manifest...');
  generateManifest(hashedFilename, hash, options);

  // Upload if not manifest-only
  let result: UploadResult = { uploaded: [], skipped: [], errors: [] };
  if (!options.manifestOnly) {
    result = await uploadAssets(hashedFilename, options);
  }

  // Summary
  console.log('\nSummary');
  console.log('-------');
  console.log(`Version: ${getVersion()}`);
  console.log(`Content Hash: ${hash}`);
  console.log(`Main File: ${hashedFilename}`);

  if (options.manifestOnly) {
    console.log('\nManifest generated (no upload)');
  } else {
    console.log(`\nUploaded: ${result.uploaded.length} files`);
    if (result.errors.length > 0) {
      console.log(`Errors: ${result.errors.length}`);
      for (const { file, error } of result.errors) {
        console.error(`  ${file}: ${error}`);
      }
      process.exit(1);
    }

    if (options.dryRun) {
      console.log('\nRun without --dry-run to upload files');
    } else {
      const cdnDomain = process.env.CDN_DOMAIN || 'https://cdn.userplane.io';
      const cdnPrefix = process.env.R2_CDN_PREFIX || 'embed';
      const cdnBase = `${cdnDomain}/${cdnPrefix}`;
      console.log('\nCDN URLs:');
      console.log(`  Bootstrap: ${cdnBase}/script.js`);
      console.log(`  Manifest:  ${cdnBase}/manifest.json`);
      console.log(`  Main:      ${cdnBase}/${hashedFilename}`);
      console.log('\nEmbed code:');
      console.log(`  <meta name="userplane:workspace" content="ws_xxx" />`);
      console.log(`  <script src="${cdnBase}/script.js"></script>`);
    }
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
