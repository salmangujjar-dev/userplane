/**
 * AdminService - Business logic for admin operations
 * Handles user management, ban/unban, and session management
 */

import { adminError } from '@workspace/contract';
import type { WorkspaceRole } from '@workspace/db';

import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import type { AdminRepository, SearchUsersParams } from '@/api/repositories/admin.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { WorkspaceService } from '@/api/services/workspace.service';

const logger = createLogger('admin-service');

export interface AdminServiceDeps {
  adminRepo: AdminRepository;
  adminUserIds: string[];
  workspaceService?: WorkspaceService;
  workspaceMemberRepo?: WorkspaceMemberRepository;
}

export class AdminService {
  constructor(private deps: AdminServiceDeps) {}

  /**
   * Check if a user has admin access (admin or csm role)
   * This grants access to the admin panel and its APIs
   */
  isAdmin(userId: string, userRole?: string | null): boolean {
    return userRole === 'admin' || userRole === 'csm' || this.deps.adminUserIds.includes(userId);
  }

  /**
   * Search users with workspace and session counts
   * Filtering logic based on viewer role:
   * - Admin: sees everyone except other admins
   * - CSM: sees only regular users (excludes admins and CSMs)
   */
  async searchUsers(
    params: Omit<SearchUsersParams, 'adminUserIds' | 'viewerRole'>,
    viewerRole: string | null
  ) {
    return this.deps.adminRepo.searchUsers({
      ...params,
      adminUserIds: this.deps.adminUserIds,
      viewerRole,
    });
  }

  /**
   * Check if a user can be impersonated
   * Admins cannot impersonate other admins
   */
  async canImpersonate(targetUserId: string): Promise<boolean> {
    const targetUser = await this.deps.adminRepo.findUserById(targetUserId);
    if (!targetUser) {
      return false;
    }
    // Cannot impersonate an admin
    return !this.isAdmin(targetUserId, targetUser.role);
  }

  /**
   * Get user detail with workspace count
   * Note: Sessions and workspaces are fetched separately via dedicated endpoints
   */
  async getUserDetail(userId: string) {
    const userDetail = await this.deps.adminRepo.findUserById(userId);
    if (!userDetail) {
      throw adminError.USER_NOT_FOUND();
    }

    const workspaceCount = await this.deps.adminRepo.getUserWorkspaceCount(userId);

    return {
      ...userDetail,
      workspaceCount,
    };
  }

  /**
   * List user workspaces with pagination
   */
  async listUserWorkspaces(userId: string, options: { limit: number; offset: number }) {
    const targetUser = await this.deps.adminRepo.findUserById(userId);
    if (!targetUser) {
      throw adminError.USER_NOT_FOUND();
    }

    const result = await this.deps.adminRepo.getUserWorkspaces(userId, options);
    return { workspaces: result.workspaces, userId, total: result.total };
  }

  /**
   * Ban a user
   * Deletes workspaces where the user has specified roles
   * Revokes all user sessions
   *
   * @param deleteWorkspacesForRoles - Array of workspace roles that trigger deletion
   *   - If user has any of these roles in a workspace, that workspace will be deleted
   *   - Default: ['owner'] (only delete workspaces where user is owner)
   *   - Options: 'owner', 'admin', 'member'
   *   - Empty array: skip workspace deletion
   */
  async banUser(
    userId: string,
    adminId: string,
    options?: {
      reason?: string;
      expiresInSeconds?: number;
      deleteWorkspacesForRoles?: WorkspaceRole[];
    }
  ) {
    // Check user exists
    const targetUser = await this.deps.adminRepo.findUserById(userId);
    if (!targetUser) {
      throw adminError.USER_NOT_FOUND();
    }

    // Cannot ban self
    if (userId === adminId) {
      throw adminError.CANNOT_BAN_SELF();
    }

    // Cannot ban another admin
    if (this.isAdmin(userId, targetUser.role)) {
      throw adminError.CANNOT_BAN_ADMIN();
    }

    // Calculate expiration
    let expiresAt: Date | undefined;
    if (options?.expiresInSeconds) {
      expiresAt = new Date(Date.now() + options.expiresInSeconds * 1000);
    }

    // Ban the user
    const updated = await this.deps.adminRepo.banUser(userId, options?.reason, expiresAt);
    if (!updated) {
      throw adminError.USER_NOT_FOUND();
    }

    // Delete workspaces where user has specified roles
    const deleteRoles = options?.deleteWorkspacesForRoles ?? ['owner'];

    if (deleteRoles.length > 0 && this.deps.workspaceService && this.deps.workspaceMemberRepo) {
      try {
        const deletedAt = new Date();
        const workspacesToDelete = new Set<string>();

        // Collect workspaces for each role
        for (const role of deleteRoles) {
          const workspaces = await this.deps.workspaceMemberRepo.findWorkspacesByUserAndRole(
            userId,
            role
          );

          for (const workspace of workspaces) {
            workspacesToDelete.add(workspace.workspaceId);
          }
        }

        // Delete unique workspaces
        for (const workspaceId of workspacesToDelete) {
          try {
            await this.deps.workspaceService.deleteWorkspace(workspaceId, deletedAt);
          } catch (error) {
            logger.error(
              { err: error, workspaceId, userId },
              'Failed to delete workspace for banned user'
            );
            captureException(error, undefined, {
              operation: 'ban_delete_workspace',
              workspace_id: workspaceId,
              user_id: userId,
            });
          }
        }

        logger.debug(
          { deletedCount: workspacesToDelete.size, userId, roles: deleteRoles.join(', ') },
          'Deleted workspaces for banned user'
        );
      } catch (error) {
        logger.error({ err: error, userId }, 'Failed to delete workspaces for banned user');
        captureException(error, undefined, { operation: 'ban_delete_workspaces', user_id: userId });
      }
    }

    // Revoke all sessions
    await this.deps.adminRepo.deleteAllUserSessions(userId);

    // Return full detail
    return this.getUserDetail(userId);
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string) {
    const targetUser = await this.deps.adminRepo.findUserById(userId);
    if (!targetUser) {
      throw adminError.USER_NOT_FOUND();
    }

    const updated = await this.deps.adminRepo.unbanUser(userId);
    if (!updated) {
      throw adminError.USER_NOT_FOUND();
    }

    return this.getUserDetail(userId);
  }

  /**
   * List user sessions with pagination
   */
  async listUserSessions(userId: string, options: { limit: number; offset: number }) {
    const targetUser = await this.deps.adminRepo.findUserById(userId);
    if (!targetUser) {
      throw adminError.USER_NOT_FOUND();
    }

    const result = await this.deps.adminRepo.getActiveUserSessions(userId, options);
    return { sessions: result.sessions, userId, total: result.total };
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string) {
    const foundSession = await this.deps.adminRepo.findSessionById(sessionId);
    if (!foundSession) {
      throw adminError.SESSION_NOT_FOUND();
    }

    const deleted = await this.deps.adminRepo.deleteSession(sessionId);
    if (!deleted) {
      throw adminError.SESSION_NOT_FOUND();
    }

    // Return remaining sessions
    const result = await this.deps.adminRepo.getActiveUserSessions(foundSession.userId);
    return { sessions: result.sessions, total: result.total, revoked: sessionId };
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessions(userId: string) {
    const targetUser = await this.deps.adminRepo.findUserById(userId);
    if (!targetUser) {
      throw adminError.USER_NOT_FOUND();
    }

    await this.deps.adminRepo.deleteAllUserSessions(userId);

    return { sessions: [], userId };
  }
}
