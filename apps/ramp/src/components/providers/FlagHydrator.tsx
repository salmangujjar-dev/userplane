'use client';

import { useEffect, useRef } from 'react';

import { applyOverrides, type FeatureFlag, type VariantFlag } from '@/lib/feature-flags';

interface FlagHydratorProps {
  overrides: Partial<Record<FeatureFlag, boolean>>;
  variantOverrides?: Partial<Record<VariantFlag, string>>;
}

export function FlagHydrator({ overrides, variantOverrides }: FlagHydratorProps) {
  const hydrated = useRef(false);

  if (!hydrated.current) {
    applyOverrides(overrides, variantOverrides);
    hydrated.current = true;
  }

  useEffect(() => {
    applyOverrides(overrides, variantOverrides);
  }, [overrides, variantOverrides]);

  return null;
}
