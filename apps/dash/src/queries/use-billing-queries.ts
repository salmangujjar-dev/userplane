import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionPreviewChangePlanResponse } from '@workspace/payments';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

/**
 * Hook to fetch subscription status for the current workspace
 * Returns whether there's an active subscription, the current plan, etc.
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

interface PreviewPlanChangeParams {
  planSlug: string;
}

interface PreviewPlanChangeResult {
  alreadyOnPlan: boolean;
  currentProductId?: string;
  newProductId?: string;
  preview?: SubscriptionPreviewChangePlanResponse;
}

/**
 * Hook to preview subscription plan change
 * Shows proration details before committing the change
 * Useful for displaying cost breakdown to users
 */
export function usePreviewPlanChange() {
  const workspaceId = useWorkspaceId();

  return useMutation<PreviewPlanChangeResult, Error, PreviewPlanChangeParams>({
    mutationFn: async ({ planSlug }) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.billing.previewPlanChange({
        params: { workspaceId },
        body: { planSlug },
      });

      if (error) {
        throw new Error(error.message || 'Failed to preview plan change');
      }

      if (!response?.data) {
        throw new Error('No response from plan change preview');
      }

      // Type assertion is safe here because the API returns properly typed data from DodoPayments
      return response.data as PreviewPlanChangeResult;
    },
  });
}

interface ChangePlanParams {
  planSlug: string;
}

interface ChangePlanResult {
  success: boolean;
  previousPlanId: string | null;
  newPlanId: string;
  alreadyOnPlan?: boolean;
}

/**
 * Hook to change subscription plan (upgrade/downgrade)
 * For workspaces that already have an active subscription
 * Note: Proration mode is controlled server-side as a business decision
 */
export function useChangePlan(options?: {
  onError?: (error: Error) => void;
  onSuccess?: (result: ChangePlanResult) => void;
}) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation<ChangePlanResult, Error, ChangePlanParams>({
    mutationFn: async ({ planSlug }) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.billing.changePlan({
        params: { workspaceId },
        body: { planSlug },
      });

      if (error) {
        throw new Error(error.message || 'Failed to change subscription plan');
      }

      if (!response?.data) {
        throw new Error('No response from plan change');
      }

      return response.data;
    },
    onSuccess: (result) => {
      const message = result.alreadyOnPlan
        ? 'Already on this plan'
        : 'Plan change initiated! Your subscription will be updated shortly.';

      toast.success(message);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['subscription-status', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      options?.onSuccess?.(result);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change subscription plan');
      options?.onError?.(error);
    },
  });
}
