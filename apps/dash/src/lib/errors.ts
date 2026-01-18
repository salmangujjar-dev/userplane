import { isDefinedError } from '@workspace/client';
import { toast } from '@workspace/ui/components/sonner';

/**
 * Re-export isDefinedError from @workspace/client for convenience
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
 * Unknown errors are thrown and should be caught by error boundaries/handlers
 */
export type SafeResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: ORPCDefinedError };

/**
 * Process API response into SafeResult
 *
 * - Known errors (isDefinedError): returned as SafeResult with success=false
 * - Unknown errors: thrown (will trigger Sentry, error boundaries, etc.)
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
 *     showErrorToast(result.error);
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
    // Unknown error - throw to be caught by React Query onError / Sentry
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
 *     showErrorToast(result.error);
 *     return;
 *   }
 * }
 * ```
 */
export function showErrorToast(error: ORPCDefinedError): void {
  toast.error(error.message);
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
  if (error instanceof Error) {
    toast.error(fallbackMessage, {
      description: error.message,
    });
  } else {
    toast.error(fallbackMessage);
  }
}
