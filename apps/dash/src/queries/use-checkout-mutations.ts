import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';

import { env } from '@/env';

interface CheckoutParams {
  planSlug: string;
  workspaceId: string;
}

interface CheckoutResult {
  url: string;
}

interface CheckoutResponse {
  url?: string;
  error?: {
    message?: string;
  };
}

interface PortalResponse {
  url?: string;
  redirect?: boolean;
  error?: {
    message?: string;
  };
}

/**
 * Hook to create a DodoPayments checkout session
 * Calls the Better Auth DodoPayments plugin checkout endpoint directly
 */
export function useCreateCheckout(options?: {
  onError?: (error: Error) => void;
  onSuccess?: (result: CheckoutResult) => void;
}) {
  return useMutation<CheckoutResult, Error, CheckoutParams>({
    mutationFn: async ({ planSlug, workspaceId }) => {
      const response = await fetch(`${env.api.url}/api/auth/dodopayments/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: planSlug,
          metadata: {
            workspace_id: workspaceId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as CheckoutResponse;
        throw new Error(errorData.error?.message || 'Failed to create checkout session');
      }

      const result = (await response.json()) as CheckoutResponse;

      if (!result.url) {
        throw new Error('No checkout URL returned');
      }

      return { url: result.url };
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
      const response = await fetch(`${env.api.url}/api/auth/dodopayments/portal`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as PortalResponse;
        throw new Error(errorData.error?.message || 'Failed to open customer portal');
      }

      const result = (await response.json()) as PortalResponse;

      if (result.redirect && result.url) {
        window.location.href = result.url;
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
