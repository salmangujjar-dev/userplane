'use client';

import { useEffect } from 'react';

import { applyOverrides, type FeatureFlag, type VariantFlag } from '@/lib/feature-flags';

interface FlagHydratorProps {
  overrides: Partial<Record<FeatureFlag, boolean>>;
  variantOverrides?: Partial<Record<VariantFlag, string>>;
}

export function FlagHydrator({ overrides, variantOverrides }: FlagHydratorProps) {
  useEffect(() => {
    applyOverrides(overrides, variantOverrides);
  }, [overrides, variantOverrides]);

  return null;
}
