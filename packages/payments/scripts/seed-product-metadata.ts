/**
 * Seed DodoPayments product metadata
 *
 * Encodes feature_limits and feature_gates as base64 and pushes them
 * to each product listed in the given plan JSON file.
 *
 * Usage:
 *   bun run packages/payments/scripts/seed-product-metadata.ts --env development --plan plans/essential.json
 *   bun run packages/payments/scripts/seed-product-metadata.ts --env production  --plan plans/starter.json
 */

import fs from 'node:fs';
import path from 'node:path';

import DodoPayments from 'dodopayments';

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function argAfter(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const envArg = argAfter('--env');
if (!envArg || (envArg !== 'development' && envArg !== 'production')) {
  console.error(
    'Usage: bun run seed-product-metadata.ts --env <development|production> --plan <plans/essential.json>'
  );
  process.exit(1);
}

const planArg = argAfter('--plan');
if (!planArg) {
  console.error(
    'Usage: bun run seed-product-metadata.ts --env <development|production> --plan <plans/essential.json>'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Parse .env file
// ---------------------------------------------------------------------------

const envFilePath = path.resolve(import.meta.dirname, '../../../apps/api', `.env.${envArg}`);

function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, 'utf8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    result[key] = val;
  }
  return result;
}

const env = parseEnvFile(envFilePath);

function requireEnv(key: string): string {
  const val = env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

// ---------------------------------------------------------------------------
// Load plan JSON
// ---------------------------------------------------------------------------

type ResourceLimits = { q: number; s: number; h: number };
type FeatureLimits = Record<string, ResourceLimits>;
type FeatureGates = Record<string, boolean>;

interface Product {
  envkey: string;
  label: string;
}

interface PlanFile {
  products: Product[];
  feature_limits: FeatureLimits;
  feature_gates: FeatureGates;
}

const planPath = path.isAbsolute(planArg) ? planArg : path.resolve(import.meta.dirname, planArg);
let plan: PlanFile;

try {
  plan = JSON.parse(fs.readFileSync(planPath, 'utf8')) as PlanFile;
} catch (err) {
  console.error(`Failed to read plan file: ${planPath}\n${(err as Error).message}`);
  process.exit(1);
}

if (!Array.isArray(plan.products) || !plan.feature_limits || !plan.feature_gates) {
  console.error('Plan JSON must have: products[], feature_limits, feature_gates');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Encode helpers
// ---------------------------------------------------------------------------

function b64(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const client = new DodoPayments({
  bearerToken: requireEnv('DODO_PAYMENTS_API_KEY'),
  environment: requireEnv('DODO_PAYMENTS_ENVIRONMENT') as 'test_mode' | 'live_mode',
});

console.log(
  `\nSeeding product metadata → ${envArg} (${requireEnv('DODO_PAYMENTS_ENVIRONMENT')})  [${path.basename(planPath)}]\n`
);

const metadata = {
  feature_limits: b64(plan.feature_limits),
  feature_gates: b64(plan.feature_gates),
};

for (const { envkey, label } of plan.products) {
  const productId = requireEnv(envkey);

  process.stdout.write(`  ${label.padEnd(24)} ${productId}  ...`);

  try {
    await client.products.update(productId, { metadata });
    console.log('  ✓');
  } catch (err) {
    console.log('  ✗');
    console.error(`    ${(err as Error).message}`);
  }
}

console.log('\nDone.\n');
