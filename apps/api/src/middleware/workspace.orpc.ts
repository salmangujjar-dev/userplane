/**
 * Workspace authorization middleware for oRPC procedures
 * Checks workspace membership and attaches workspace context
 */

import { ORPCError } from '@orpc/server';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceRole } from '@workspace/db';
import { NotFoundError, GoneError } from '@/api/lib/errors';
import { base, type AuthContext } from './auth.orpc';

export type WorkspaceContext = {
  workspaceId: string;
  workspaceMemberId: string;
  workspaceRole: WorkspaceRole;
};

export function createWorkspaceMiddleware(
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) {
  return base
    .$context<AuthContext>()
    .middleware(async ({ context, next }, input: { workspaceId: string }) => {
      const workspaceId = input.workspaceId;

      if (!workspaceId) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Workspace ID is required',
        });
      }

      try {
        const workspace = await workspaceService.getById(workspaceId);
        const member = await workspaceMemberService.getMember(context.user.id, workspace.id);

        if (!member) {
          throw new ORPCError('FORBIDDEN', {
            message: 'You are not a member of this workspace',
          });
        }

        return next({
          context: {
            workspaceId: workspace.id,
            workspaceMemberId: member.id,
            workspaceRole: member.workspaceRole,
          },
        });
      } catch (error) {
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        throw error;
      }
    });
}

export function createWorkspaceRoleMiddleware(
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  allowedRoles: WorkspaceRole[]
) {
  return base
    .$context<AuthContext>()
    .middleware(async ({ context, next }, input: { workspaceId: string }) => {
      const workspaceId = input.workspaceId;

      if (!workspaceId) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Workspace ID is required',
        });
      }

      try {
        const workspace = await workspaceService.getById(workspaceId);
        const member = await workspaceMemberService.getMember(context.user.id, workspace.id);

        if (!member) {
          throw new ORPCError('FORBIDDEN', {
            message: 'You are not a member of this workspace',
          });
        }

        if (!allowedRoles.includes(member.workspaceRole)) {
          throw new ORPCError('FORBIDDEN', {
            message: 'You do not have permission to perform this action',
          });
        }

        return next({
          context: {
            workspaceId: workspace.id,
            workspaceMemberId: member.id,
            workspaceRole: member.workspaceRole,
          },
        });
      } catch (error) {
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        throw error;
      }
    });
}
