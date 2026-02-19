import type { PlanId } from '@workspace/pricing';

export type BillingInterval = 'monthly' | 'annual';

export const DODO_ADDON_IDS = {
  seats: {
    monthly: process.env.DODO_ADD_ON_SEATS_MONTHLY || '',
    annual: process.env.DODO_ADD_ON_SEATS_ANNUAL || '',
  },
} as const;

export function getBillingIntervalFromPlanId(planId: PlanId | string): BillingInterval {
  return planId.includes('annual') ? 'annual' : 'monthly';
}

export function getSeatsAddonIdForInterval(interval: BillingInterval): string | null {
  const addonId = DODO_ADDON_IDS.seats[interval];
  return addonId ? addonId : null;
}

export function getSeatsAddonIdForPlanId(planId: PlanId | string): string | null {
  return getSeatsAddonIdForInterval(getBillingIntervalFromPlanId(planId));
}

export function isSeatsAddonId(addonId: string): boolean {
  return (
    addonId.length > 0 &&
    (addonId === DODO_ADDON_IDS.seats.monthly || addonId === DODO_ADDON_IDS.seats.annual)
  );
}
