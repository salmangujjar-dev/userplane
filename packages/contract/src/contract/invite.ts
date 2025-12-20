import { oc } from '@orpc/contract';
import { InviteActionQuerySchema, InviteActionResultSchema, ApiResponseSchema } from '../schemas';

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
  .input(InviteActionQuerySchema)
  .output(ApiResponseSchema(InviteActionResultSchema));
