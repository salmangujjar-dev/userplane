import type { FeatureGate, FeatureLimit } from '@userplane/pricing';
import { useQueryStates } from 'nuqs';

import { planModalParser, upsellFeatureParser } from '@/lib/parsers';

export function useFeatureUpsell() {
  const [, setParams] = useQueryStates({
    'plan-modal': planModalParser,
    'upsell-feature': upsellFeatureParser,
  });

  const triggerUpsell = (feature: FeatureGate) => {
    setParams({
      'plan-modal': 'suggested',
      'upsell-feature': feature,
    });
  };

  const triggerResourceUpsell = (resource: FeatureLimit) => {
    setParams({
      'plan-modal': 'suggested',
      'upsell-feature': resource,
    });
  };

  return { triggerUpsell, triggerResourceUpsell };
}
