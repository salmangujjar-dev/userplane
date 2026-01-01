/**
 * Invite errors
 * From InviteService
 * Status codes follow HTTP semantics and match actual service implementation:
 *   401 - Unauthorized (invalid/expired tokens)
 *   410 - Gone (invalidated tokens)
 */
export const InviteErrors = {
  // Token validation errors
  INVITE_TOKEN_INVALID: {
    status: 401,
    message: 'Invalid or expired invite token',
  },
  INVITE_TOKEN_INVALIDATED: {
    status: 410,
    message: 'Invite token has been invalidated',
  },
} as const;
