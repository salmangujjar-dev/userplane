import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

import { billingKeys } from './query-keys';

/**
 * Hook to fetch subscription status for the current workspace
 * Returns whether there's an active subscription, the current plan, etc.
 *
 * Note: Plan changes (upgrade/downgrade) are handled via the DodoPayments
 * Customer Portal, which provides a native self-service experience.
 * Use the useOpenCustomerPortal hook from use-checkout-mutations.ts to open it.
 */
export function useSubscriptionStatus() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: billingKeys.subscription(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.billing.getStatus({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch usage summary for the current workspace
 * Returns resource consumption, limits, and progress for all entitlements
 */
export function useUsageSummary() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: billingKeys.usage(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.billing.getUsage({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 60 * 1000, // 1 minute - usage changes frequently
    retry: 1,
  });
}

/**
 * Hook to fetch add-ons status for the current workspace
 * Returns current seats add-on quantity and computed additional seats
 */
export function useAddonsStatus() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: billingKeys.addons(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.billing.getAddons({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
