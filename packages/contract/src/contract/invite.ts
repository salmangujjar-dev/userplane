import { oc } from '@orpc/contract';
import {
  SendInvitesSchema,
  SendInvitesResultSchema,
  InviteActionQuerySchema,
  InviteActionResultSchema,
  ApiResponseSchema,
} from '../schemas';

/**
 * Invite contract
 * Endpoints for workspace invitation operations
 */

/**
 * POST /api/v1/invite
 * Send workspace invitations via email
 */
export const sendInvites = oc
  .route({
    method: 'POST',
    path: '/api/v1/invite',
    summary: 'Send invites',
    description: 'Send workspace invitations to multiple email addresses',
    tags: ['Invites'],
  })
  .input(SendInvitesSchema)
  .output(ApiResponseSchema(SendInvitesResultSchema));

/**
 * GET /api/v1/invite
 * Validate or accept an invitation
 */
export const inviteAction = oc
  .route({
    method: 'GET',
    path: '/api/v1/invite',
    summary: 'Handle invite action',
    description: 'Validate or accept a workspace invitation using token',
    tags: ['Invites'],
  })
  .input(InviteActionQuerySchema)
  .output(ApiResponseSchema(InviteActionResultSchema));
