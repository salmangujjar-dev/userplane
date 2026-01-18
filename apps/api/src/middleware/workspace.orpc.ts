/**
 * Workspace authorization middleware for oRPC procedures
 * Checks workspace membership and attaches workspace context
 */

import type { WorkspaceRole } from '@workspace/contract';
import { workspaceError } from '@workspace/contract';

import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';

import { type AuthContext, base } from './auth.orpc';

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
        throw workspaceError.WORKSPACE_ID_REQUIRED();
      }

      const workspace = await workspaceService.getById(workspaceId);
      const member = await workspaceMemberService.getMember(context.user.id, workspace.workspaceId);

      if (!member) {
        throw workspaceError.FORBIDDEN();
      }

      return next({
        context: {
          workspaceId: workspace.workspaceId,
          workspaceMemberId: member.workspaceMemberId,
          workspaceRole: member.workspaceRole,
        },
      });
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
        throw workspaceError.WORKSPACE_ID_REQUIRED();
      }

      const workspace = await workspaceService.getById(workspaceId);
      const member = await workspaceMemberService.getMember(context.user.id, workspace.workspaceId);

      if (!member) {
        throw workspaceError.FORBIDDEN();
      }

      if (!allowedRoles.includes(member.workspaceRole)) {
        throw workspaceError.FORBIDDEN();
      }

      return next({
        context: {
          workspaceId: workspace.workspaceId,
          workspaceMemberId: member.workspaceMemberId,
          workspaceRole: member.workspaceRole,
        },
      });
    });
}
