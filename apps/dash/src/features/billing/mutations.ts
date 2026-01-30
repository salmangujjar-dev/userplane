import { useMutation } from '@tanstack/react-query';
import type { ManagePlanData, PlanChangePreviewData } from '@workspace/contract';
import type { PlanId } from '@workspace/pricing';

import { apiClient } from '@/client';
import { authClient } from '@/client/auth';
import { handleUnknownError } from '@/lib/errors';

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
  message?: string;
}

/**
 * Hook to manage workspace plan changes
 * Unified hook for checkout, preview, execute, and request flows
 * Server routes to appropriate flow based on subscription status and user role
 */
export function useManagePlan(callbacks?: ManagePlanCallbacks) {
  return useMutation<ManagePlanData, Error, ManagePlanInput>({
    mutationFn: async (input: ManagePlanInput) => {
      const [error, response] = await apiClient.billing.managePlan({
        params: { workspaceId: input.workspaceId },
        body: {
          planId: input.planId,
          action: input.action,
          message: input.message,
        },
      });

      if (error) {
        throw error;
      }

      if (!response?.data) {
        throw new Error('No data returned from manage plan');
      }

      return response.data;
    },
    onSuccess: (data) => {
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
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const result = await authClient.dodopayments.customer.portal();
      if (result.error) {
        throw new Error(result.error.message || 'Failed to open customer portal');
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
