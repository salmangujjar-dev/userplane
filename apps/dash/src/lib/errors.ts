import { toast } from '@workspace/ui/components/sonner';

/**
 * Type for defined API errors from oRPC
 */
interface ORPCDefinedError {
  defined: true;
  code: string;
  status: number;
  message: string;
}

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
 * Process a safe client result into a SafeResult
 *
 * - Known errors (isDefinedError): returned as SafeResult with success=false
 * - Unknown errors: thrown (will trigger Sentry, error boundaries, etc.)
 *
 * @example
 * ```ts
 * mutationFn: async (input) => {
 *   const [error, response] = await apiClient.route.method({ ... });
 *   return handleSafeResult(error, response);
 * },
 * onSuccess: (result) => {
 *   if (!result.success) {
 *     handleApiError(result.error, 'Failed to do thing');
 *     return;
 *   }
 *   toast.success('Done!');
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
 * Type guard to check if an error is a defined oRPC error
 */
function isDefinedError(error: unknown): error is ORPCDefinedError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'defined' in error &&
    (error as ORPCDefinedError).defined === true &&
    'code' in error &&
    typeof (error as ORPCDefinedError).code === 'string'
  );
}

/**
 * All known error codes from the contract
 * Maps error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Account errors
  USER_NOT_FOUND: 'User not found',
  USER_NAME_REQUIRED: 'Name cannot be empty',

  // Workspace errors
  WORKSPACE_NOT_FOUND: 'Workspace not found',
  WORKSPACE_GONE: 'This workspace has been deleted',
  WORKSPACE_NAME_REQUIRED: 'Workspace name is required',
  WORKSPACE_NAME_TOO_LONG: 'Workspace name must be less than 255 characters',
  WORKSPACE_DELETE_FAILED: 'Failed to delete workspace',
  WORKSPACE_SEARCH_UNAVAILABLE: 'Search is not available',

  // Workspace member errors
  WORKSPACE_MEMBER_NOT_FOUND: 'Member not found',
  WORKSPACE_MEMBER_ALREADY_EXISTS: 'User is already a member of this workspace',
  WORKSPACE_MEMBER_CANNOT_CHANGE_OWN_ROLE: "You can't change your own role",
  WORKSPACE_MEMBER_CANNOT_REMOVE_SELF: "You can't remove yourself. Use leave workspace instead.",
  WORKSPACE_MEMBER_LAST_OWNER_ROLE_CHANGE:
    "Can't change role of the last owner. Promote another member first.",
  WORKSPACE_MEMBER_LAST_OWNER_REMOVE: "Can't remove the last owner from workspace",
  WORKSPACE_MEMBER_LAST_OWNER_LEAVE:
    "Can't leave as the last owner. Transfer ownership or delete the workspace.",

  // Project errors
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_GONE: 'This project has been deleted',
  PROJECT_DEFAULT_NOT_FOUND: 'No default project found',
  PROJECT_WORKSPACE_MISMATCH: 'Project does not belong to this workspace',
  PROJECT_LAST_PROJECT_DELETE_FORBIDDEN: "Can't delete the only project in a workspace",
  PROJECT_DELETE_FAILED: 'Failed to delete project',

  // Domain errors
  DOMAIN_NOT_FOUND: 'Domain not found',
  DOMAIN_GONE: 'This domain has been deleted',
  DOMAIN_ALREADY_EXISTS: 'This domain has already been added',
  DOMAIN_WORKSPACE_MISMATCH: 'Domain does not belong to this workspace',
  DOMAIN_LAST_DOMAIN_DELETE_FORBIDDEN: "Can't delete the only domain",
  DOMAIN_DELETE_FAILED: 'Failed to delete domain',
  DOMAIN_VERIFICATION_FAILED: 'Failed to verify domain',
  DOMAIN_UNVERIFIED: 'Please verify the domain first',
  DOMAIN_PREFERENCES_UPDATE_FAILED: 'Failed to update domain preferences',

  // Link errors
  LINK_NOT_FOUND: 'Link not found',
  LINK_GONE: 'This link has been deleted',
  LINK_TOKEN_INVALID: 'Invalid link token',
  LINK_TOKEN_EXPIRED: 'Link token has expired',
  LINK_WORKSPACE_DELETED: 'The workspace for this link was deleted',
  LINK_PROJECT_DELETED: 'The project for this link was deleted',
  LINK_CREATE_FAILED: 'Failed to create link',
  LINK_UPDATE_FAILED: 'Failed to update link',
  LINK_DELETE_FAILED: 'Failed to delete link',

  // Recording errors
  RECORDING_NOT_FOUND: 'Recording not found',
  RECORDING_GONE: 'This recording has been deleted',
  RECORDING_WORKSPACE_MISMATCH: 'Recording does not belong to this workspace',
  RECORDING_DELETE_FAILED: 'Failed to delete recording',

  // Invite errors
  INVITE_TOKEN_INVALID: 'Invalid or expired invite',
  INVITE_TOKEN_INVALIDATED: 'This invite has been revoked',

  // Generic errors
  UNAUTHORIZED: 'Please sign in to continue',
  FORBIDDEN: 'You do not have permission to do this',
  INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again.',
};

/**
 * Export the defined error type
 */
export type { ORPCDefinedError as DefinedError };

/**
 * Get a user-friendly error message for a given error code
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || 'An unexpected error occurred';
}

/**
 * Handle an API error with appropriate toast notification
 *
 * @example
 * ```ts
 * onError: (error) => {
 *   handleApiError(error, 'Failed to update workspace');
 * }
 * ```
 */
export function handleApiError(error: unknown, fallbackMessage: string): void {
  if (isDefinedError(error)) {
    const message = getErrorMessage(error.code);
    toast.error(message);
  } else if (error instanceof Error) {
    toast.error(fallbackMessage, {
      description: error.message,
    });
  } else {
    toast.error(fallbackMessage);
  }
}

/**
 * Check if error matches a specific error code
 *
 * @example
 * ```ts
 * if (isErrorCode(error, 'WORKSPACE_MEMBER_LAST_OWNER_LEAVE')) {
 *   // Show special UI for this case
 * }
 * ```
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return isDefinedError(error) && error.code === code;
}

/**
 * Check if error matches any of the given error codes
 *
 * @example
 * ```ts
 * if (isAnyErrorCode(error, ['WORKSPACE_NOT_FOUND', 'WORKSPACE_GONE'])) {
 *   // Redirect to workspaces list
 * }
 * ```
 */
export function isAnyErrorCode(error: unknown, codes: string[]): boolean {
  return isDefinedError(error) && codes.includes(error.code);
}

/**
 * Helper to handle query results with SafeResult pattern
 *
 * Like handleSafeResult but designed for React Query queries
 * Prevents known errors from being thrown (and triggering Sentry)
 *
 * @example
 * ```ts
 * queryFn: async () => {
 *   const [error, response] = await apiClient.route.method({ ... });
 *   return handleQueryResult(error, response);
 * }
 *
 * // In component:
 * const { data } = useQuery(...);
 * if (data && !data.success) {
 *   // Handle known error gracefully
 *   return <ErrorState message={getErrorMessage(data.error.code)} />;
 * }
 * ```
 */
export function handleQueryResult<T>(error: unknown, response: T | null): SafeResult<T> {
  return handleSafeResult(error, response);
}

/**
 * Export isDefinedError for use in components
 */
export { isDefinedError };
