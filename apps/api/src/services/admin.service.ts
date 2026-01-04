/**
 * AdminService - Business logic for admin operations
 * Handles user management, ban/unban, and session management
 */

import { ORPCError } from '@orpc/server';
import type { AdminRepository, SearchUsersParams } from '@/api/repositories/admin.repository';

export interface AdminServiceDeps {
  adminRepo: AdminRepository;
  adminUserIds: string[];
}

export class AdminService {
  constructor(private deps: AdminServiceDeps) {}

  /**
   * Check if a user is an admin
   */
  isAdmin(userId: string, userRole?: string | null): boolean {
    return userRole === 'admin' || this.deps.adminUserIds.includes(userId);
  }

  /**
   * Search users with workspace and session counts
   * Excludes admin users from results
   */
  async searchUsers(params: Omit<SearchUsersParams, 'adminUserIds'>) {
    return this.deps.adminRepo.searchUsers({
      ...params,
      adminUserIds: this.deps.adminUserIds,
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
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
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
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
    }

    const result = await this.deps.adminRepo.getUserWorkspaces(userId, options);
    return { workspaces: result.workspaces, userId, total: result.total };
  }

  /**
   * Ban a user
   */
  async banUser(
    userId: string,
    adminId: string,
    options?: { reason?: string; expiresInSeconds?: number }
  ) {
    // Check user exists
    const targetUser = await this.deps.adminRepo.findUserById(userId);
    if (!targetUser) {
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
    }

    // Cannot ban self
    if (userId === adminId) {
      throw new ORPCError('CANNOT_BAN_SELF', {
        status: 400,
        message: 'You cannot ban yourself',
      });
    }

    // Cannot ban another admin
    if (this.isAdmin(userId, targetUser.role)) {
      throw new ORPCError('CANNOT_BAN_ADMIN', {
        status: 400,
        message: 'You cannot ban another admin',
      });
    }

    // Calculate expiration
    let expiresAt: Date | undefined;
    if (options?.expiresInSeconds) {
      expiresAt = new Date(Date.now() + options.expiresInSeconds * 1000);
    }

    // Ban the user
    const updated = await this.deps.adminRepo.banUser(userId, options?.reason, expiresAt);
    if (!updated) {
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
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
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
    }

    const updated = await this.deps.adminRepo.unbanUser(userId);
    if (!updated) {
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
    }

    return this.getUserDetail(userId);
  }

  /**
   * List user sessions with pagination
   */
  async listUserSessions(userId: string, options: { limit: number; offset: number }) {
    const targetUser = await this.deps.adminRepo.findUserById(userId);
    if (!targetUser) {
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
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
      throw new ORPCError('SESSION_NOT_FOUND', {
        status: 404,
        message: 'Session not found',
      });
    }

    await this.deps.adminRepo.deleteSession(sessionId);

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
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
    }

    await this.deps.adminRepo.deleteAllUserSessions(userId);

    return { sessions: [], userId };
  }
}
