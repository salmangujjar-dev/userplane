import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { featureFlagOverrides, variantFlagOverrides } from '@/lib/db/schema';
import {
  applyOverrides,
  type FeatureFlag,
  FLAG_DEFAULTS,
  VARIANT_DEFAULTS,
  type VariantFlag,
} from '@/lib/feature-flags';

export function getOverridesMap(): Partial<Record<FeatureFlag, boolean>> {
  const rows = db.select().from(featureFlagOverrides).all();
  const map: Partial<Record<FeatureFlag, boolean>> = {};
  for (const row of rows) {
    map[row.flag as FeatureFlag] = row.value;
  }
  return map;
}

export function getVariantOverridesMap(): Partial<Record<VariantFlag, string>> {
  const rows = db.select().from(variantFlagOverrides).all();
  const map: Partial<Record<VariantFlag, string>> = {};
  for (const row of rows) {
    map[row.flag as VariantFlag] = row.value;
  }
  return map;
}

export function loadAndApplyOverrides(): void {
  const overrides = getOverridesMap();
  const variantOverrides = getVariantOverridesMap();
  applyOverrides(overrides, variantOverrides);
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

export function setVariantOverride(flag: VariantFlag, value: string): void {
  db.insert(variantFlagOverrides)
    .values({ flag, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: variantFlagOverrides.flag,
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run();
  loadAndApplyOverrides();
}

export function clearVariantOverride(flag: VariantFlag): void {
  db.delete(variantFlagOverrides).where(eq(variantFlagOverrides.flag, flag)).run();
  loadAndApplyOverrides();
}

export function clearAllOverrides(): void {
  db.transaction((tx) => {
    tx.delete(featureFlagOverrides).run();
    tx.delete(variantFlagOverrides).run();
  });
  loadAndApplyOverrides();
}

export function setOverrides(
  overrides: Partial<Record<FeatureFlag, boolean>>,
  variantOverrides?: Partial<Record<VariantFlag, string>>
): void {
  db.transaction((tx) => {
    tx.delete(featureFlagOverrides).run();

    for (const [flag, value] of Object.entries(overrides) as [FeatureFlag, boolean][]) {
      if (flag in FLAG_DEFAULTS && value !== FLAG_DEFAULTS[flag]) {
        tx.insert(featureFlagOverrides)
          .values({ flag, value, updatedAt: new Date().toISOString() })
          .run();
      }
    }

    if (variantOverrides) {
      tx.delete(variantFlagOverrides).run();

      for (const [flag, value] of Object.entries(variantOverrides) as [VariantFlag, string][]) {
        if (flag in VARIANT_DEFAULTS && value !== VARIANT_DEFAULTS[flag]) {
          tx.insert(variantFlagOverrides)
            .values({ flag, value, updatedAt: new Date().toISOString() })
            .run();
        }
      }
    }
  });

  loadAndApplyOverrides();
}
