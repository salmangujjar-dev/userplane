import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';

import { authClient } from '@/client/auth';

interface CheckoutParams {
  planSlug: string;
  workspaceId: string;
}

interface CheckoutResult {
  url: string;
}

/**
 * Hook to create a DodoPayments checkout session
 * Uses the Better Auth DodoPayments plugin with checkoutSession method
 * Customer info is automatically pulled from the Better Auth session
 * Billing info can be collected on the checkout page
 */
export function useCreateCheckout(options?: {
  onError?: (error: Error) => void;
  onSuccess?: (result: CheckoutResult) => void;
}) {
  return useMutation<CheckoutResult, Error, CheckoutParams>({
    mutationFn: async ({ planSlug, workspaceId }) => {
      // Use checkoutSession which auto-pulls customer from session
      // and collects billing on checkout page
      const result = await authClient.dodopayments.checkoutSession({
        slug: planSlug,
        referenceId: workspaceId,
        metadata: {
          workspace_id: workspaceId,
        },
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
