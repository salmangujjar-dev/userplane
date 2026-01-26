import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CheckoutSessionData,
  ManagePlanData,
  PlanChangePreviewData,
  PlanChangeRequestData,
  PlanChangeResultData,
} from '@workspace/contract';
import type { PlanId } from '@workspace/pricing';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import { authClient } from '@/client/auth';
import { handleSafeResult } from '@/lib/errors';

/**
 * Hook to open the DodoPayments customer portal
 */
export function useOpenCustomerPortal(options?: {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}) {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const result = await authClient.dodopayments.customer.portal();

      if (result.error) {
        throw new Error(result.error.message || 'Failed to open customer portal');
      }

      if (result.data?.redirect && result.data?.url) {
        window.location.href = result.data.url;
      }
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to open billing portal');
      options?.onError?.(error);
    },
  });
}

interface ManagePlanParams {
  workspaceId: string;
  planId: PlanId;
  action?: 'preview' | 'execute';
  message?: string;
}

/**
 * Hook to manage workspace plan (unified endpoint)
 *
 * This hook replaces useCreateCheckout, usePreviewPlanChange, useChangePlan, and useRequestPlanChange.
 * The server automatically routes to the appropriate flow based on subscription status and user role:
 * - No subscription + owner/admin: Returns checkout URL
 * - Active subscription + owner/admin (no action): Returns preview
 * - Active subscription + owner/admin (action=execute): Executes plan change
 * - Active subscription + member: Creates request and sends email to owners
 */
export function useManagePlan(options?: {
  onCheckout?: (data: CheckoutSessionData) => void;
  onPreview?: (data: PlanChangePreviewData) => void;
  onExecute?: (data: PlanChangeResultData) => void;
  onRequest?: (data: PlanChangeRequestData) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<ManagePlanData, Error, ManagePlanParams>({
    mutationFn: async ({ workspaceId, planId, action, message }) => {
      const [error, response] = await apiClient.billing.managePlan({
        params: { workspaceId },
        body: { planId, action, message },
      });

      const result = handleSafeResult(error, response?.data ?? null);
      if (!result.success) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Route based on discriminated union response type
      switch (data.type) {
        case 'checkout':
          options?.onCheckout?.(data.data);
          break;
        case 'preview':
          options?.onPreview?.(data.data);
          break;
        case 'execute':
          // Invalidate subscription status to reflect the change
          queryClient.invalidateQueries({
            queryKey: ['subscription-status', variables.workspaceId],
          });
          toast.success('Plan changed successfully');
          options?.onExecute?.(data.data);
          break;
        case 'request':
          toast.success('Plan change request sent to workspace owner');
          options?.onRequest?.(data.data);
          break;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to manage plan');
      options?.onError?.(error);
    },
  });
}
