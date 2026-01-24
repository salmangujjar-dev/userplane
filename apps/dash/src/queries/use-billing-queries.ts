import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

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
    queryKey: ['subscription-status', workspaceId],
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
