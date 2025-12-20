/**
 * Invite contract implementation using oRPC
 * Implements the standalone invite contract for public invite validation
 */

import { ORPCError, implement } from '@orpc/server';
import { contract } from '@workspace/contract';
import type { InviteService } from '@/api/services/invite.service';
import { ValidationError, NotFoundError } from '@/api/lib/errors';

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
 */
export const validateInviteImpl = (inviteService: InviteService) => {
  return base.invite.validate.handler(async ({ input }) => {
    try {
      const result = await inviteService.validateInvite(input.body.token);

      // Handle validation status
      if (result.status !== 'valid') {
        throw new ValidationError(result.message || 'Invalid invitation');
      }

      return {
        message: 'Invitation validated successfully',
        data: {
          workspaceId: result.workspaceId!,
          workspaceName: result.workspaceName!,
          invitedByName: result.inviterName!,
          invitedByEmail: result.inviterEmail!,
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        });
      }
      if (error instanceof NotFoundError) {
        throw new ORPCError('NOT_FOUND', {
          message: error.message,
        });
      }
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
      throw error;
    }
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
