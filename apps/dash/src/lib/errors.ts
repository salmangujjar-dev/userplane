// See also: @/lib/toasts for pattern-based toast helpers (clipboard, CRUD, settings, validation)
import { isDefinedError } from '@userplane/client';
import { toast } from '@userplane/ui/components/sonner';
import posthog from 'posthog-js';

/**
 * Re-export isDefinedError from @userplane/client for convenience
 */
export { isDefinedError };

/**
 * Type for defined API errors from oRPC
 * The API provides user-friendly messages - use error.message directly
 */
interface ORPCDefinedError {
  defined: true;
  code: string;
  status: number;
  message: string;
}

/**
 * Export the defined error type
 */
export type { ORPCDefinedError as DefinedError };

/**
 * Result type for safe API operations
 * - Success: contains data, no error
 * - Failure: contains known error, no data
 *
 * Unknown errors are thrown and should be caught by error boundaries/handlers.
 *
 * Convention: defined API errors must be returned as SafeResult (via handleSafeResult)
 * and handled in the UI; do not throw them. In development, Next.js may still show
 * the error overlay when a boundary catches an error; production only shows boundary UI.
 */
export type SafeResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: ORPCDefinedError };

/**
 * Process API response into SafeResult
 *
 * - Known errors (isDefinedError): returned as SafeResult with success=false
 * - Unknown errors: thrown (will trigger PostHog, error boundaries, etc.)
 *
 * Use this for both queries and mutations.
 *
 * @example Mutation pattern
 * ```ts
 * mutationFn: async (input) => {
 *   const [error, response] = await apiClient.route.method({ ... });
 *   return handleSafeResult(error, response);
 * },
 * onSuccess: (result) => {
 *   if (!result.success) {
 *     showErrorToastToast(result.error);
 *     return;
 *   }
 *   toast.success('Done!');
 * }
 * ```
 *
 * @example Query pattern
 * ```ts
 * queryFn: async () => {
 *   const [error, response] = await apiClient.route.method({ ... });
 *   return handleSafeResult(error, response);
 * }
 *
 * // In component:
 * const { data } = useQuery(...);
 * if (data && !data.success) {
 *   return <ErrorState message={data.error.message} />;
 * }
 * ```
 */
export function handleSafeResult<T>(error: unknown, response: T | null): SafeResult<T> {
  if (error) {
    if (isDefinedError(error)) {
      return { success: false, error };
    }
    // Unknown error - capture in PostHog and throw to be caught by React Query onError
    posthog.captureException(error, { error_type: 'api_unknown_error' });
    throw error;
  }
  return { success: true, data: response as T };
}

/**
 * Show toast with API error message
 * Uses the message from the API directly
 *
 * @example
 * ```ts
 * onSuccess: (result) => {
 *   if (!result.success) {
 *     showErrorToastToast(result.error);
 *     return;
 *   }
 * }
 * ```
 */
export function showErrorToastToast(
  error: ORPCDefinedError,
  options?: { retry?: () => void }
): void {
  toast.error(error.message, {
    ...(options?.retry && {
      action: { label: 'Retry', onClick: options.retry },
    }),
  });
}

/**
 * Handle unknown errors with fallback message
 * For use in React Query onError handlers
 *
 * @example
 * ```ts
 * onError: (error) => {
 *   handleUnknownError(error, 'Failed to update workspace');
 * }
 * ```
 */
export function handleUnknownError(error: unknown, fallbackMessage: string): void {
  posthog.captureException(error, {
    error_type: 'unknown_error',
    fallback_message: fallbackMessage,
  });

  toast.error(fallbackMessage, {
    description: error instanceof Error ? error.message : 'An unexpected error occurred',
    action: {
      label: 'Contact support',
      onClick: () => {
        window.location.href = 'mailto:support@userplane.com';
      },
    },
  });
}
