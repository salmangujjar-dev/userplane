import { useMutation } from '@tanstack/react-query';
import type { PlanId } from '@workspace/pricing';

import { apiClient } from '@/client';
import { authClient } from '@/client/auth';
import { handleSafeResult, handleUnknownError } from '@/lib/errors';
import type { PlanChangePreviewData } from '@/types';

interface ManagePlanCallbacks {
  onCheckout?: (data: { slug: string }) => void;
  onPreview?: (data: PlanChangePreviewData) => void;
  onExecute?: (data: { newPlanName: string }) => void;
  onRequest?: (data: { planName: string }) => void;
  onError?: (error: Error & { code?: string; data?: { code?: string; message?: string } }) => void;
}

interface ManagePlanInput {
  planId: PlanId;
  workspaceId: string;
  action?: 'preview' | 'execute';
}

/**
 * Hook to manage workspace plan changes
 * Unified hook for checkout, preview, execute, and request flows
 * Server routes to appropriate flow based on subscription status and user role
 */
export function useManagePlan(callbacks?: ManagePlanCallbacks) {
  return useMutation({
    mutationFn: async (input: ManagePlanInput) => {
      const [error, response] = await apiClient.billing.managePlan({
        params: { workspaceId: input.workspaceId },
        body: {
          planId: input.planId,
          action: input.action,
        },
      });
      const result = handleSafeResult(error, response?.data ?? null);
      if (result.success && result.data === null) {
        throw new Error('No data returned from manage plan');
      }
      return result;
    },
    onSuccess: (result) => {
      if (!result.success) {
        if (callbacks?.onError) {
          callbacks.onError(
            result.error as unknown as Error & {
              code?: string;
              data?: { code?: string; message?: string };
            }
          );
        } else {
          handleUnknownError(result.error, 'Failed to manage plan');
        }
        return;
      }
      const data = result.data;
      if (data.type === 'checkout' && callbacks?.onCheckout) {
        callbacks.onCheckout({ slug: data.data.slug });
      } else if (data.type === 'preview' && callbacks?.onPreview) {
        callbacks.onPreview(data.data);
      } else if (data.type === 'execute' && callbacks?.onExecute) {
        callbacks.onExecute({ newPlanName: data.data.newPlanName });
      } else if (data.type === 'request' && callbacks?.onRequest) {
        callbacks.onRequest({ planName: data.data.planName });
      }
    },
    onError: (error: unknown) => {
      const err = error as Error & { code?: string; data?: { code?: string; message?: string } };
      if (callbacks?.onError) {
        callbacks.onError(err);
      } else {
        handleUnknownError(error, 'Failed to manage plan');
      }
    },
  });
}

/**
 * Hook to open the DodoPayments customer portal
 * Redirects user to portal for managing subscription, payment methods, etc.
 */
export function useOpenCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const result = await authClient.dodopayments.customer.portal();
      return handleSafeResult(result.error, result.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        handleUnknownError(result.error, 'Failed to open customer portal');
        return;
      }
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to open customer portal');
    },
  });
}
