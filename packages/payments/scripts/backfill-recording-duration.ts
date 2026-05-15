/**
 * Backfill recording_max_duration for existing workspaces
 *
 * Sets workspace.recordingMaxDurationMs and upserts the recording_max_duration
 * entitlement row for every workspace. Existing paid subscribers (especially
 * Scale Up and Enterprise) may have NULL values after the recording limits
 * feature was added, causing them to fall back to 3 minutes instead of their
 * plan's actual limit.
 *
 * Usage:
 *   bun run packages/payments/scripts/backfill-recording-duration.ts --env development
 *   bun run packages/payments/scripts/backfill-recording-duration.ts --env production
 *   bun run packages/payments/scripts/backfill-recording-duration.ts --env production --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';

import { createDb, eq, sql } from '@userplane/db';
import { workspaces, subscriptions, entitlements } from '@userplane/db';
import { FREE_PLAN_ENTITLEMENTS } from '@userplane/pricing';
import DodoPayments from 'dodopayments';

import { fetchProductMetadata } from '../src/metadata';

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
    'Usage: bun run backfill-recording-duration.ts --env <development|production> [--dry-run]'
  );
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

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
// ID generation (mirrors apps/api/src/lib/id.ts without nanoid dependency)
// ---------------------------------------------------------------------------

import crypto from 'node:crypto';

function generateEntitlementId(): string {
  return `ent_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const db = createDb({ databaseUrl: requireEnv('DATABASE_URL') });

const dodoClient = new DodoPayments({
  bearerToken: requireEnv('DODO_PAYMENTS_API_KEY'),
  environment: requireEnv('DODO_PAYMENTS_ENVIRONMENT') as 'test_mode' | 'live_mode',
});

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const FREE_RECORDING_DURATION = FREE_PLAN_ENTITLEMENTS.recording_max_duration;

async function main() {
  console.log(
    `\nBackfilling recording_max_duration → ${envArg} (${requireEnv('DODO_PAYMENTS_ENVIRONMENT')})${dryRun ? '  [DRY RUN]' : ''}\n`
  );

  // Query all non-deleted workspaces with their subscription (if any)
  const rows = await db
    .select({
      workspaceId: workspaces.workspaceId,
      recordingMaxDurationMs: workspaces.recordingMaxDurationMs,
      productId: subscriptions.productId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      billingCadence: subscriptions.billingCadence,
    })
    .from(workspaces)
    .leftJoin(subscriptions, eq(workspaces.workspaceId, subscriptions.workspaceId))
    .where(eq(workspaces.isDeleted, false));

  console.log(`  Found ${rows.length} workspace(s)\n`);

  // Cache product metadata to avoid repeated API calls for the same product
  const metadataCache = new Map<string, { quotedLimit: number; actualLimit: number } | null>();

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    const label = `${row.workspaceId} (${row.planId ?? 'free'})`;

    try {
      let quotedLimit: number;
      let actualLimit: number;
      let billingCadence: string | null = null;

      if (row.productId && row.status === 'active') {
        // Paid workspace — resolve from DodoPayments product metadata
        if (!metadataCache.has(row.productId)) {
          const metadata = await fetchProductMetadata(dodoClient, row.productId);
          const limits = metadata.featureLimits?.recording_max_duration ?? null;
          metadataCache.set(
            row.productId,
            limits ? { quotedLimit: limits.quotedLimit, actualLimit: limits.actualLimit } : null
          );
        }

        const cached = metadataCache.get(row.productId);
        if (!cached) {
          console.log(
            `  ${label.padEnd(50)}  SKIP (no recording_max_duration in product metadata)`
          );
          skippedCount++;
          continue;
        }

        quotedLimit = cached.quotedLimit;
        actualLimit = cached.actualLimit;
        billingCadence = row.billingCadence ?? null;
      } else {
        // Free workspace (no subscription or non-active status)
        quotedLimit = FREE_RECORDING_DURATION.quotedLimit;
        actualLimit = FREE_RECORDING_DURATION.actualLimit;
      }

      const currentMs = row.recordingMaxDurationMs;
      const changed = currentMs !== actualLimit;

      if (dryRun) {
        console.log(
          `  ${label.padEnd(50)}  ${changed ? `WOULD UPDATE ${currentMs ?? 'NULL'} → ${actualLimit}` : `OK (already ${actualLimit})`}`
        );
        if (changed) updatedCount++;
        else skippedCount++;
        continue;
      }

      // Update workspace.recordingMaxDurationMs AND upsert entitlement row atomically
      await db.transaction(async (tx) => {
        // Update workspace column
        await tx
          .update(workspaces)
          .set({ recordingMaxDurationMs: actualLimit })
          .where(eq(workspaces.workspaceId, row.workspaceId));

        // Upsert recording_max_duration entitlement row
        await tx
          .insert(entitlements)
          .values({
            id: generateEntitlementId(),
            workspaceId: row.workspaceId,
            resourceType: 'recording_max_duration',
            quotedLimit,
            actualLimit,
            resourceConsumed: 0,
            ...(billingCadence !== null && { billingCadence }),
          })
          .onConflictDoUpdate({
            target: [entitlements.workspaceId, entitlements.resourceType],
            set: {
              quotedLimit: sql`excluded.quoted_limit`,
              actualLimit: sql`excluded.actual_limit`,
              ...(billingCadence !== null && { billingCadence: sql`excluded.billing_cadence` }),
              updatedAt: new Date(),
            },
          });
      });

      console.log(
        `  ${label.padEnd(50)}  ${changed ? `UPDATED ${currentMs ?? 'NULL'} → ${actualLimit}` : `OK (upserted entitlement, already ${actualLimit})`}`
      );
      updatedCount++;
    } catch (err) {
      console.log(`  ${label.padEnd(50)}  ERROR`);
      console.error(`    ${(err as Error).message}`);
      errorCount++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped: ${skippedCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log(`\nDone.\n`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

await main();
