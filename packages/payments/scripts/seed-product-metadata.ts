/**
 * Seed DodoPayments product metadata
 *
 * Pushes flat metadata keys (one per limit field, one per feature gate) to each
 * product listed in the given plan JSON file. No base64 encoding — all values are
 * human-readable strings directly visible in the DodoPayments dashboard.
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

interface Product {
  envkey: string;
  label: string;
  metadata?: Record<string, string>;
}

interface PlanFile {
  products: Product[];
  metadata: Record<string, string>;
}

const planPath = path.isAbsolute(planArg) ? planArg : path.resolve(import.meta.dirname, planArg);
let plan: PlanFile;

try {
  plan = JSON.parse(fs.readFileSync(planPath, 'utf8')) as PlanFile;
} catch (err) {
  console.error(`Failed to read plan file: ${planPath}\n${(err as Error).message}`);
  process.exit(1);
}

if (!Array.isArray(plan.products) || !plan.metadata || typeof plan.metadata !== 'object') {
  console.error('Plan JSON must have: products[], metadata');
  process.exit(1);
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

console.log(`  Pushing ${Object.keys(plan.metadata).length} flat metadata keys\n`);

for (const { envkey, label, metadata: productMetadata } of plan.products) {
  const productId = requireEnv(envkey);
  const mergedMetadata = { ...plan.metadata, ...productMetadata };

  process.stdout.write(`  ${label.padEnd(24)} ${productId}  ...`);

  try {
    await client.products.update(productId, { metadata: mergedMetadata });
    console.log('  ✓');
  } catch (err) {
    console.log('  ✗');
    console.error(`    ${(err as Error).message}`);
  }
}

console.log('\nDone.\n');
