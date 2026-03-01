import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlanId } from '@userplane/pricing';

import { apiClient } from '@/client';
import { handleSafeResult, handleUnknownError } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';
import type { PlanChangePreviewData } from '@/types';

import { billingKeys } from './query-keys';

interface ManagePlanCallbacks {
  onCheckout?: (data: { checkoutUrl: string; slug: string }) => void;
  onPreview?: (data: PlanChangePreviewData) => void;
  onExecute?: (data: { newPlanName: string }) => void;
  onError?: (error: Error & { code?: string; data?: { code?: string; message?: string } }) => void;
}

interface ManagePlanInput {
  planId?: PlanId;
  productId?: string;
  workspaceId: string;
  action?: 'preview' | 'execute';
}

/**
 * Hook to manage workspace plan changes
 * Unified hook for checkout, preview, execute, and request flows
 * Server routes to appropriate flow based on subscription status and user role
 */
export function useManagePlan(callbacks?: ManagePlanCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ManagePlanInput) => {
      const [error, response] = await apiClient.billing.managePlan({
        params: { workspaceId: input.workspaceId },
        body: {
          ...(input.planId ? { planId: input.planId } : {}),
          ...(input.productId ? { productId: input.productId } : {}),
          action: input.action,
        },
      });
      const result = handleSafeResult(error, response?.data ?? null);
      if (result.success && result.data === null) {
        throw new Error('No data returned from manage plan');
      }
      return result;
    },
    onSuccess: (result, variables) => {
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
      if (data.type === 'execute') {
        void queryClient.invalidateQueries({
          queryKey: billingKeys.subscription(variables.workspaceId),
        });
        void queryClient.invalidateQueries({
          queryKey: billingKeys.usage(variables.workspaceId),
        });
      }
      if (data.type === 'checkout' && callbacks?.onCheckout) {
        callbacks.onCheckout({ checkoutUrl: data.data.checkoutUrl, slug: data.data.slug });
      } else if (data.type === 'preview' && callbacks?.onPreview) {
        callbacks.onPreview(data.data);
      } else if (data.type === 'execute' && callbacks?.onExecute) {
        callbacks.onExecute({ newPlanName: data.data.newPlanName });
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
export function useOpenCustomerPortal(options?: { onPermissionDenied?: () => void }) {
  const workspaceId = useWorkspaceId();

  return useMutation({
    mutationFn: async () => {
      const [error, response] = await apiClient.billing.getPortal({
        params: { workspaceId: workspaceId! },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        if (
          result.error.code === 'BILLING_MANAGEMENT_UNAVAILABLE_FOR_MEMBER' &&
          options?.onPermissionDenied
        ) {
          options.onPermissionDenied();
          return;
        }
        handleUnknownError(result.error, 'Failed to open customer portal');
        return;
      }
      if (result.data?.portalUrl) {
        window.location.href = result.data.portalUrl;
      }
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to open customer portal');
    },
  });
}

interface ManageAddonsCallbacks {
  onPreview?: (data: PlanChangePreviewData) => void;
  onExecute?: (data: { newPlanName: string }) => void;
  onError?: (error: Error & { code?: string; data?: { code?: string; message?: string } }) => void;
}

interface ManageAddonsInput {
  seatsQuantity: number;
  workspaceId: string;
  action?: 'preview' | 'execute';
}

export function useManageAddons(callbacks?: ManageAddonsCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ManageAddonsInput) => {
      const [error, response] = await apiClient.billing.manageAddons({
        params: { workspaceId: input.workspaceId },
        body: {
          seatsQuantity: input.seatsQuantity,
          action: input.action,
        },
      });
      const result = handleSafeResult(error, response?.data ?? null);
      if (result.success && result.data === null) {
        throw new Error('No data returned from manage add-ons');
      }
      return result;
    },
    onSuccess: (result, variables) => {
      if (!result.success) {
        if (callbacks?.onError) {
          callbacks.onError(
            result.error as unknown as Error & {
              code?: string;
              data?: { code?: string; message?: string };
            }
          );
        } else {
          handleUnknownError(result.error, 'Failed to manage add-ons');
        }
        return;
      }

      const data = result.data;
      if (data.type === 'execute') {
        void queryClient.invalidateQueries({
          queryKey: billingKeys.addons(variables.workspaceId),
        });
        void queryClient.invalidateQueries({
          queryKey: billingKeys.usage(variables.workspaceId),
        });
        void queryClient.invalidateQueries({
          queryKey: billingKeys.subscription(variables.workspaceId),
        });
      }

      if (data.type === 'preview' && callbacks?.onPreview) {
        callbacks.onPreview(data.data);
      } else if (data.type === 'execute' && callbacks?.onExecute) {
        callbacks.onExecute({ newPlanName: data.data.newPlanName });
      }
    },
    onError: (error: unknown) => {
      const err = error as Error & { code?: string; data?: { code?: string; message?: string } };
      if (callbacks?.onError) {
        callbacks.onError(err);
      } else {
        handleUnknownError(error, 'Failed to manage add-ons');
      }
    },
  });
}
