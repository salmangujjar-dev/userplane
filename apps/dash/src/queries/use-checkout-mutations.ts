import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PlanChangePreviewData,
  PlanChangeRequestData,
  PlanChangeResultData,
} from '@workspace/contract';
import type { PlanId } from '@workspace/pricing';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import { authClient } from '@/client/auth';
import { env } from '@/env';
import { handleSafeResult } from '@/lib/errors';

interface CheckoutParams {
  planId: PlanId;
  workspaceId: string;
}

interface CheckoutResult {
  url: string;
}

interface PlanChangeParams {
  planId: PlanId;
  workspaceId: string;
}

/**
 * Hook to create a DodoPayments checkout session
 *
 * Two-step process:
 * 1. Calls API with planId to validate permissions and get product slug
 *    - Checks workspace owner/admin role
 *    - Verifies no existing subscription
 *    - Converts planId to DodoPayments product slug (server-side)
 * 2. Uses Better Auth plugin with slug to create checkout session
 *    - Auto-pulls customer info from authenticated session
 *    - Redirects to DodoPayments checkout page
 */
export function useCreateCheckout(options?: {
  onError?: (error: Error) => void;
  onSuccess?: (result: CheckoutResult) => void;
}) {
  return useMutation<CheckoutResult, Error, CheckoutParams>({
    mutationFn: async ({ planId, workspaceId }) => {
      // Call API to validate permissions and get product slug
      // API keeps product configuration server-side
      const [error, response] = await apiClient.billing.createCheckout({
        body: { planId, workspaceId },
      });

      if (error || !response?.data?.slug) {
        throw new Error(error?.message || 'Failed to create checkout session');
      }

      const slug = response.data.slug;

      // Use Better Auth's DodoPayments plugin to create checkout session
      // This auto-pulls customer info from the authenticated session
      const result = await authClient.dodopayments.checkoutSession({
        slug,
        referenceId: workspaceId,
        metadata: {
          workspace_id: workspaceId,
        },
        customization: {
          theme: 'light',
          show_order_details: true,
          show_on_demand_tag: false,
        },
        return_url: `${env.dashboard.url}/${workspaceId || ''}/settings?tab=plan-usage`,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create checkout session');
      }

      if (!result.data?.url) {
        throw new Error('No checkout URL returned');
      }

      return { url: result.data.url };
    },
    onSuccess: (result) => {
      options?.onSuccess?.(result);
      // Redirect to checkout
      window.location.href = result.url;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start checkout');
      options?.onError?.(error);
    },
  });
}

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

/**
 * Hook to preview plan change proration details
 *
 * Shows the user exactly what they'll be charged (or credited) before
 * confirming a plan upgrade or downgrade.
 */
export function usePreviewPlanChange(options?: {
  onError?: (error: Error) => void;
  onSuccess?: (data: PlanChangePreviewData) => void;
}) {
  return useMutation<PlanChangePreviewData, Error, PlanChangeParams>({
    mutationFn: async ({ planId, workspaceId }) => {
      const [error, response] = await apiClient.billing.previewPlanChange({
        params: { workspaceId },
        body: { planId },
      });

      const result = handleSafeResult(error, response?.data ?? null);
      if (!result.success) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to preview plan change');
      options?.onError?.(error);
    },
  });
}

/**
 * Hook to execute plan change
 *
 * Upgrades or downgrades the subscription plan.
 * DB updates happen asynchronously via webhook.
 */
export function useChangePlan(options?: {
  onError?: (error: Error) => void;
  onSuccess?: (data: PlanChangeResultData) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<PlanChangeResultData, Error, PlanChangeParams>({
    mutationFn: async ({ planId, workspaceId }) => {
      const [error, response] = await apiClient.billing.changePlan({
        params: { workspaceId },
        body: { planId },
      });

      const result = handleSafeResult(error, response?.data ?? null);
      if (!result.success) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate subscription status to reflect the change
      queryClient.invalidateQueries({
        queryKey: ['subscription-status', variables.workspaceId],
      });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change plan');
      options?.onError?.(error);
    },
  });
}

interface PlanChangeRequestParams {
  planId: PlanId;
  workspaceId: string;
  message?: string;
}

/**
 * Hook to request a plan change (for non-admin users)
 *
 * Sends an email notification to workspace owners requesting
 * a plan upgrade or downgrade.
 */
export function useRequestPlanChange(options?: {
  onError?: (error: Error) => void;
  onSuccess?: (data: PlanChangeRequestData) => void;
}) {
  return useMutation<PlanChangeRequestData, Error, PlanChangeRequestParams>({
    mutationFn: async ({ planId, workspaceId, message }) => {
      const [error, response] = await apiClient.billing.requestPlanChange({
        params: { workspaceId },
        body: { planId, message },
      });

      const result = handleSafeResult(error, response?.data ?? null);
      if (!result.success) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Plan change request sent to workspace owner');
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send plan change request');
      options?.onError?.(error);
    },
  });
}
