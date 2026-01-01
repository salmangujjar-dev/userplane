/**
 * Account errors
 * From UserService and auth middleware
 * Status codes follow HTTP semantics and match actual service implementation:
 *   400 - Bad Request (validation errors)
 *   401 - Unauthorized (authentication errors)
 *   404 - Not Found (resource not found)
 */
export const AccountErrors = {
  // Validation errors
  USER_NAME_REQUIRED: {
    status: 400,
    message: 'Name cannot be empty',
  },

  // Authentication errors (from auth middleware)
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },

  // Not found errors
  USER_NOT_FOUND: {
    status: 404,
    message: 'User not found',
  },
} as const;
