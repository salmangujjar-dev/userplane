import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { featureFlagOverrides } from '@/lib/db/schema';
import { type FeatureFlag, applyOverrides } from '@/lib/feature-flags';

export function getOverridesMap(): Partial<Record<FeatureFlag, boolean>> {
  const rows = db.select().from(featureFlagOverrides).all();
  const map: Partial<Record<FeatureFlag, boolean>> = {};
  for (const row of rows) {
    map[row.flag as FeatureFlag] = row.value;
  }
  return map;
}

export function loadAndApplyOverrides(): void {
  const overrides = getOverridesMap();
  applyOverrides(overrides);
}

export function setOverride(flag: FeatureFlag, value: boolean): void {
  db.insert(featureFlagOverrides)
    .values({ flag, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: featureFlagOverrides.flag,
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run();
  loadAndApplyOverrides();
}

export function clearOverride(flag: FeatureFlag): void {
  db.delete(featureFlagOverrides).where(eq(featureFlagOverrides.flag, flag)).run();
  loadAndApplyOverrides();
}

export function clearAllOverrides(): void {
  db.delete(featureFlagOverrides).run();
  loadAndApplyOverrides();
}
