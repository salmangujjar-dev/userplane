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

export async function getOverridesMap(): Promise<Partial<Record<FeatureFlag, boolean>>> {
  const rows = await db.select().from(featureFlagOverrides).all();
  const map: Partial<Record<FeatureFlag, boolean>> = {};
  for (const row of rows) {
    map[row.flag as FeatureFlag] = row.value;
  }
  return map;
}

export async function getVariantOverridesMap(): Promise<Partial<Record<VariantFlag, string>>> {
  const rows = await db.select().from(variantFlagOverrides).all();
  const map: Partial<Record<VariantFlag, string>> = {};
  for (const row of rows) {
    map[row.flag as VariantFlag] = row.value;
  }
  return map;
}

export async function loadAndApplyOverrides(): Promise<{
  overrides: Partial<Record<FeatureFlag, boolean>>;
  variantOverrides: Partial<Record<VariantFlag, string>>;
}> {
  const [overrides, variantOverrides] = await Promise.all([
    getOverridesMap(),
    getVariantOverridesMap(),
  ]);
  applyOverrides(overrides, variantOverrides);
  return { overrides, variantOverrides };
}

export async function setOverride(flag: FeatureFlag, value: boolean): Promise<void> {
  await db
    .insert(featureFlagOverrides)
    .values({ flag, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: featureFlagOverrides.flag,
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run();
  await loadAndApplyOverrides();
}

export async function clearOverride(flag: FeatureFlag): Promise<void> {
  await db.delete(featureFlagOverrides).where(eq(featureFlagOverrides.flag, flag)).run();
  await loadAndApplyOverrides();
}

export async function setVariantOverride(flag: VariantFlag, value: string): Promise<void> {
  await db
    .insert(variantFlagOverrides)
    .values({ flag, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: variantFlagOverrides.flag,
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run();
  await loadAndApplyOverrides();
}

export async function clearVariantOverride(flag: VariantFlag): Promise<void> {
  await db.delete(variantFlagOverrides).where(eq(variantFlagOverrides.flag, flag)).run();
  await loadAndApplyOverrides();
}

export async function clearAllOverrides(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(featureFlagOverrides).run();
    await tx.delete(variantFlagOverrides).run();
  });
  await loadAndApplyOverrides();
}

export async function setOverrides(
  overrides: Partial<Record<FeatureFlag, boolean>>,
  variantOverrides?: Partial<Record<VariantFlag, string>>
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(featureFlagOverrides).run();

    for (const [flag, value] of Object.entries(overrides) as [FeatureFlag, boolean][]) {
      if (flag in FLAG_DEFAULTS && value !== FLAG_DEFAULTS[flag]) {
        await tx
          .insert(featureFlagOverrides)
          .values({ flag, value, updatedAt: new Date().toISOString() })
          .run();
      }
    }

    if (variantOverrides) {
      await tx.delete(variantFlagOverrides).run();

      for (const [flag, value] of Object.entries(variantOverrides) as [VariantFlag, string][]) {
        if (flag in VARIANT_DEFAULTS && value !== VARIANT_DEFAULTS[flag]) {
          await tx
            .insert(variantFlagOverrides)
            .values({ flag, value, updatedAt: new Date().toISOString() })
            .run();
        }
      }
    }
  });

  await loadAndApplyOverrides();
}
