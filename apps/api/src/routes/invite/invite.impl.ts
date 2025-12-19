/**
 * Invite contract implementation using oRPC
 * Implements the standalone invite contract for public invite actions
 */

import { ORPCError, implement } from '@orpc/server';
import { contract } from '@workspace/contract';
import { auth } from '@/api/clients/auth';
import type { InviteService } from '@/api/services/invite.service';
import { ValidationError, NotFoundError, ConflictError } from '@/api/lib/errors';

/**
 * Initial context with headers
 */
type InitialContext = {
  headers: Headers;
};

/**
 * Public base for invite endpoints (no auth required for validation)
 * Auth is required for acceptance, handled within the service
 */
const base = implement(contract).$context<InitialContext>();

/**
 * GET /invite - Validate or accept invitation
 * Public endpoint for validation, requires auth for acceptance
 */
export const inviteActionImpl = (inviteService: InviteService) => {
  return base.invite.action.handler(async ({ input, context }) => {
    try {
      if (input.action === 'validate') {
        // Validate invitation - no auth required
        const result = await inviteService.validateInvite(input.token);

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
      } else {
        // Accept invitation - requires authenticated user
        const headers = context.headers as Headers;
        const sessionData = await auth.api.getSession({ headers });

        if (!sessionData?.user) {
          throw new ORPCError('UNAUTHORIZED', {
            message: 'You must be logged in to accept invitations',
          });
        }

        const result = await inviteService.acceptInvite({
          inviteToken: input.token,
          userId: sessionData.user.id,
        });

        return {
          message: 'Invitation accepted successfully',
          data: {
            workspaceId: result.workspace.workspaceId,
            workspaceName: result.workspace.workspaceName,
            invitedByName: '',
            invitedByEmail: '',
          },
        };
      }
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
      if (error instanceof ConflictError) {
        throw new ORPCError('CONFLICT', {
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
    action: inviteActionImpl(inviteService),
  };
};
