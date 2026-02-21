import type { FeatureLimit } from '@workspace/pricing';

import { useFeatureUpsell } from './use-feature-upsell';

interface PlanLimitError {
  code?: string;
  data?: { resource?: FeatureLimit };
}

export function usePlanLimitHandler() {
  const { triggerResourceUpsell } = useFeatureUpsell();

  const handlePlanLimit = (error: PlanLimitError): boolean => {
    if (error.code === 'PLAN_LIMIT_EXCEEDED') {
      const resource = error.data?.resource;
      if (resource) triggerResourceUpsell(resource);
      return true;
    }
    return false;
  };

  return { handlePlanLimit };
}
