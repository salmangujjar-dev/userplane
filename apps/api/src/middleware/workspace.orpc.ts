/**
 * Workspace authorization middleware for oRPC procedures
 * Checks workspace membership and attaches workspace context
 */

import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceRole } from '@workspace/contract';
import { base, type AuthContext } from './auth.orpc';
import { workspaceError, domainError } from '@workspace/contract';

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
        throw domainError.FORBIDDEN();
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
        throw domainError.FORBIDDEN();
      }

      if (!allowedRoles.includes(member.workspaceRole)) {
        throw domainError.FORBIDDEN();
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
