import { useQueryStates } from 'nuqs';

import { planModalParser, upsellFeatureParser } from '@/lib/parsers';
import type { UpsellFeatureKey } from '@/lib/upsell-config';

export function useFeatureUpsell() {
  const [, setParams] = useQueryStates({
    'plan-modal': planModalParser,
    'upsell-feature': upsellFeatureParser,
  });

  const triggerUpsell = (feature: UpsellFeatureKey) => {
    setParams({
      'plan-modal': 'suggested',
      'upsell-feature': feature,
    });
  };

  return { triggerUpsell };
}
