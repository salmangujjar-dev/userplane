/**
 * Workspace authorization middleware for oRPC procedures
 * Checks workspace membership and attaches workspace context
 */

import type { WorkspaceRole } from '@userplane/contract';
import { workspaceError } from '@userplane/contract';

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
      // Use cached membership lookup for fast auth checks
      const member = await workspaceMemberService.getMembershipForAuth(
        context.user.id,
        workspace.workspaceId
      );

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
      // Use cached membership lookup for fast auth checks
      const member = await workspaceMemberService.getMembershipForAuth(
        context.user.id,
        workspace.workspaceId
      );

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

/**
 * Workspace restore middleware
 * Similar to createWorkspaceRoleMiddleware but allows deleted workspaces
 * Used for restore endpoints where workspace may be soft-deleted
 * Note: This does NOT use caching since it's for restore flows with deleted members
 */
export function createWorkspaceRestoreMiddleware(
  workspaceMemberService: WorkspaceMemberService,
  allowedRoles: WorkspaceRole[]
) {
  return base
    .$context<AuthContext>()
    .middleware(async ({ context, next }, input: { workspaceId: string }) => {
      const workspaceId = input.workspaceId;

      if (!workspaceId) {
        throw workspaceError.WORKSPACE_ID_REQUIRED();
      }

      // Skip workspace validation for deleted workspaces
      // Only check if user is a member with the required role (including soft-deleted members)
      // Note: getMemberIncludingDeleted is not cached as it's a rare restore operation
      const member = await workspaceMemberService.getMemberIncludingDeleted(
        context.user.id,
        workspaceId
      );

      if (!member) {
        throw workspaceError.FORBIDDEN();
      }

      if (!allowedRoles.includes(member.workspaceRole)) {
        throw workspaceError.FORBIDDEN();
      }

      return next({
        context: {
          workspaceId,
          workspaceMemberId: member.workspaceMemberId,
          workspaceRole: member.workspaceRole,
        },
      });
    });
}
