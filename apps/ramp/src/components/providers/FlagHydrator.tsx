'use client';

import { useEffect, useRef } from 'react';

import { applyOverrides, type FeatureFlag } from '@/lib/feature-flags';

interface FlagHydratorProps {
  overrides: Partial<Record<FeatureFlag, boolean>>;
}

export function FlagHydrator({ overrides }: FlagHydratorProps) {
  const hydrated = useRef(false);

  if (!hydrated.current) {
    applyOverrides(overrides);
    hydrated.current = true;
  }

  useEffect(() => {
    applyOverrides(overrides);
  }, [overrides]);

  return null;
}
