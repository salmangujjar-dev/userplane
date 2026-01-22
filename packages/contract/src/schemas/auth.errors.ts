/**
 * Authentication errors
 * From Better Auth hooks and authentication flows
 * Status codes follow HTTP semantics:
 *   400 - Bad Request (validation errors)
 *   403 - Forbidden (policy violations)
 */
export const AuthErrors = {
  // Email validation errors
  DISPOSABLE_EMAIL_NOT_ALLOWED: {
    status: 403,
    message: 'Disposable email addresses are not allowed. Please use a permanent email address.',
  },
} as const;
