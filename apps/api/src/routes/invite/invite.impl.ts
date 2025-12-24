/**
 * Invite contract implementation using oRPC
 * Implements the standalone invite contract for public invite validation
 */

import { implement } from '@orpc/server';
import { contract } from '@workspace/contract';
import type { InviteService } from '@/api/services/invite.service';

/**
 * Initial context with headers
 */
type InitialContext = {
  headers: Headers;
};

/**
 * Public base for invite endpoints (no auth required)
 */
const base = implement(contract).$context<InitialContext>();

/**
 * POST /invite/validate - Validate invitation token
 * Public endpoint - no authentication required
 * Returns workspace and inviter information if token is valid
 * Service throws ORPCError directly, no error mapping needed
 */
export const validateInviteImpl = (inviteService: InviteService) => {
  return base.invite.validate.handler(async ({ input }) => {
    const result = await inviteService.validateInvite(input.body.token);

    return {
      message: 'Invitation validated successfully',
      data: {
        workspaceId: result.workspaceId,
        workspaceName: result.workspaceName,
        invitedByName: result.inviterName,
        invitedByEmail: result.inviterEmail,
      },
    };
  });
};

/**
 * Create the invite procedures object
 */
export const createInviteProcedures = (inviteService: InviteService) => {
  return {
    validate: validateInviteImpl(inviteService),
  };
};
