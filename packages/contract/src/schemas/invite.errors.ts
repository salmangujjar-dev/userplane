/**
 * Invite errors
 * From InviteService
 */
export const InviteErrors = {
  INVITE_TOKEN_INVALID: {
    message: 'Invalid or expired invite token',
  },
  INVITE_TOKEN_INVALIDATED: {
    message: 'Invite token has been invalidated',
  },
} as const;
