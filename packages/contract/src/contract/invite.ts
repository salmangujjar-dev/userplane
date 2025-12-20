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
 * POST /invite
 * Send workspace invitations via email
 */
export const sendInvites = oc
  .route({
    method: 'POST',
    path: '/invite',
    inputStructure: 'detailed',
    summary: 'Send invites',
    description: 'Send workspace invitations to multiple email addresses',
    tags: ['Invites'],
  })
  .input(SendInvitesSchema)
  .output(ApiResponseSchema(SendInvitesResultSchema));

/**
 * GET /invite
 * Validate or accept an invitation
 */
export const inviteAction = oc
  .route({
    method: 'GET',
    path: '/invite',
    inputStructure: 'detailed',
    summary: 'Handle invite action',
    description: 'Validate or accept a workspace invitation using token',
    tags: ['Invites'],
  })
  .input(InviteActionQuerySchema)
  .output(ApiResponseSchema(InviteActionResultSchema));
