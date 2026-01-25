import { useMutation } from '@tanstack/react-query';
import type { PlanId } from '@workspace/pricing';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import { authClient } from '@/client/auth';
import { env } from '@/env';

interface CheckoutParams {
  planId: PlanId;
  workspaceId: string;
}

interface CheckoutResult {
  url: string;
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
