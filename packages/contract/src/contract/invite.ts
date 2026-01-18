import { oc } from '@orpc/contract';

import {
  ApiResponseSchema,
  InviteActionQuerySchema,
  InviteActionResultSchema,
  InviteErrors,
} from '../schemas';

/**
 * Invite contract
 * Public invitation validation endpoint
 * Note: Sending invites is handled by workspace contract at /workspace/{workspaceId}/invite
 */

/**
 * POST /invite/validate
 * Validate an invitation token
 * Public endpoint - no authentication required
 */
export const validateInvite = oc
  .route({
    method: 'POST',
    path: '/invite/validate',
    inputStructure: 'detailed',
    summary: 'Validate invite',
    description: 'Validate a workspace invitation token without accepting',
    tags: ['Invites'],
  })
  .errors({
    INVITE_TOKEN_INVALID: InviteErrors.INVITE_TOKEN_INVALID,
    INVITE_TOKEN_INVALIDATED: InviteErrors.INVITE_TOKEN_INVALIDATED,
  })
  .input(InviteActionQuerySchema)
  .output(ApiResponseSchema(InviteActionResultSchema));
