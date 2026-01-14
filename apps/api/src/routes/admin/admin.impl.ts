/**
 * Admin route implementations
 * Handlers for admin user, workspace, and recording management operations
 */

import { isValidRoleName } from '@workspace/auth';
import { authorized } from '@/api/middleware/auth.orpc';
import { createAdminMiddleware } from '@/api/middleware/admin.orpc';
import type { AdminService } from '@/api/services/admin.service';
import type { AdminWorkspaceService } from '@/api/services/admin-workspace.service';
import type { AdminRecordingService } from '@/api/services/admin-recording.service';
import type { AdminProvisioningService } from '@/api/services/admin-provisioning.service';
import { getPlanName, DEFAULT_PLAN_NAME } from '@workspace/pricing';

/**
 * Format date to ISO string
 */
function formatDate(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/**
 * Format session for response
 */
function formatSession(session: {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  impersonatedBy: string | null;
}) {
  return {
    id: session.id,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    impersonatedBy: session.impersonatedBy,
  };
}

/**
 * Format user detail for response
 * Note: Sessions and workspaces are fetched separately via dedicated endpoints
 */
function formatUserDetail(user: {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  workspaceCount: number;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    banned: user.banned,
    banReason: user.banReason,
    banExpires: formatDate(user.banExpires),
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    workspaceCount: user.workspaceCount,
  };
}

/**
 * Format user workspace for response
 */
function formatUserWorkspace(workspace: {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}) {
  return {
    workspaceId: workspace.workspaceId,
    workspaceName: workspace.workspaceName,
    workspaceRole: workspace.workspaceRole,
    joinedAt: workspace.joinedAt.toISOString(),
  };
}

/**
 * Search users implementation
 */
const searchUsersImpl = (adminService: AdminService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.users.search.handler(async ({ input, context }) => {
    const { search, limit, offset, sortBy, sortDirection, filterStatus } = input.query;

    // Validate and narrow the role type
    const userRole = context.user.role;
    const validatedRole = userRole && isValidRoleName(userRole) ? userRole : null;

    const result = await adminService.searchUsers(
      {
        search,
        limit,
        offset,
        sortBy,
        sortDirection,
        filterStatus,
      },
      validatedRole
    );

    return {
      message: 'Users retrieved successfully',
      data: {
        users: result.users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          role: u.role,
          banned: u.banned,
          banReason: u.banReason,
          banExpires: formatDate(u.banExpires),
          emailVerified: u.emailVerified,
          createdAt: u.createdAt.toISOString(),
          workspaceCount: u.workspaceCount,
        })),
        total: result.total,
        limit,
        offset,
      },
    };
  });
};

/**
 * Get user detail implementation
 */
const getUserImpl = (adminService: AdminService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.users.get.handler(async ({ input }) => {
    const userDetail = await adminService.getUserDetail(input.params.userId);

    return {
      message: 'User retrieved successfully',
      data: formatUserDetail(userDetail),
    };
  });
};

/**
 * Ban user implementation
 */
const banUserImpl = (adminService: AdminService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.users.ban.handler(async ({ input, context }) => {
    const userDetail = await adminService.banUser(input.params.userId, context.user.id, {
      reason: input.body.reason,
      expiresInSeconds: input.body.expiresInSeconds,
    });

    return {
      message: 'User banned successfully',
      data: formatUserDetail(userDetail),
    };
  });
};

/**
 * Unban user implementation
 */
const unbanUserImpl = (adminService: AdminService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.users.unban.handler(async ({ input }) => {
    const userDetail = await adminService.unbanUser(input.params.userId);

    return {
      message: 'User unbanned successfully',
      data: formatUserDetail(userDetail),
    };
  });
};

/**
 * List user sessions implementation
 */
const listUserSessionsImpl = (adminService: AdminService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.users.sessions.list.handler(async ({ input }) => {
    const { limit, offset } = input.query;
    const result = await adminService.listUserSessions(input.params.userId, { limit, offset });

    return {
      message: 'Sessions retrieved successfully',
      data: {
        sessions: result.sessions.map(formatSession),
        userId: result.userId,
        total: result.total,
        limit,
        offset,
      },
    };
  });
};

/**
 * Revoke session implementation
 */
const revokeSessionImpl = (adminService: AdminService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.sessions.revoke.handler(async ({ input }) => {
    const result = await adminService.revokeSession(input.params.sessionId);

    return {
      message: 'Session revoked successfully',
      data: {
        sessions: result.sessions.map(formatSession),
        revoked: result.revoked,
      },
    };
  });
};

/**
 * Revoke all sessions implementation
 */
const revokeAllSessionsImpl = (adminService: AdminService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized
    .use(adminMiddleware)
    .admin.users.sessions.revokeAll.handler(async ({ input }) => {
      const result = await adminService.revokeAllSessions(input.params.userId);

      return {
        message: 'All sessions revoked successfully',
        data: {
          sessions: result.sessions.map(formatSession),
          userId: result.userId,
          total: 0, // All sessions were revoked
          limit: 0,
          offset: 0,
        },
      };
    });
};

/**
 * List user workspaces implementation
 */
const listUserWorkspacesImpl = (adminService: AdminService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.users.workspaces.list.handler(async ({ input }) => {
    const { limit, offset } = input.query;
    const result = await adminService.listUserWorkspaces(input.params.userId, { limit, offset });

    return {
      message: 'Workspaces retrieved successfully',
      data: {
        workspaces: result.workspaces.map(formatUserWorkspace),
        userId: result.userId,
        total: result.total,
        limit,
        offset,
      },
    };
  });
};

// ============================================
// WORKSPACE FORMATTERS
// ============================================

/**
 * Format workspace member for response
 */
function formatWorkspaceMember(member: {
  userId: string;
  userName: string;
  userEmail: string;
  workspaceRole: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}) {
  return {
    userId: member.userId,
    userName: member.userName,
    userEmail: member.userEmail,
    workspaceRole: member.workspaceRole,
    joinedAt: member.joinedAt.toISOString(),
  };
}

/**
 * Format workspace detail for response
 * Note: Members are fetched separately via listWorkspaceMembers endpoint
 */
function formatWorkspaceDetail(workspace: {
  workspaceId: string;
  workspaceName: string;
  workspacePlan: import('@workspace/pricing').PlanId;
  createdAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  memberCount: number;
  projectCount: number;
  domainCount: number;
  linkCount: number;
  recordingCount: number;
}) {
  const workspacePlanName = getPlanName(workspace.workspacePlan);

  return {
    workspaceId: workspace.workspaceId,
    workspaceName: workspace.workspaceName,
    workspacePlan: workspace.workspacePlan,
    workspacePlanName,
    createdAt: workspace.createdAt.toISOString(),
    isDeleted: workspace.isDeleted,
    deletedAt: formatDate(workspace.deletedAt),
    memberCount: workspace.memberCount,
    projectCount: workspace.projectCount,
    domainCount: workspace.domainCount,
    linkCount: workspace.linkCount,
    recordingCount: workspace.recordingCount,
  };
}

// ============================================
// WORKSPACE PROCEDURES
// ============================================

/**
 * Search workspaces implementation
 */
const searchWorkspacesImpl = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.workspaces.search.handler(async ({ input }) => {
    const { search, limit, offset, sortBy, sortDirection, filterStatus, filterPlan } = input.query;

    const result = await adminWorkspaceService.searchWorkspaces({
      search,
      limit,
      offset,
      sortBy,
      sortDirection,
      filterStatus,
      filterPlan,
    });

    return {
      message: 'Workspaces retrieved successfully',
      data: {
        workspaces: result.workspaces.map((w) => ({
          workspaceId: w.workspaceId,
          workspaceName: w.workspaceName,
          workspacePlan: w.workspacePlan,
          workspacePlanName: getPlanName(w.workspacePlan),
          createdAt: w.createdAt.toISOString(),
          memberCount: w.memberCount,
          projectCount: w.projectCount,
          domainCount: w.domainCount,
          linkCount: w.linkCount,
          recordingCount: w.recordingCount,
          isDeleted: w.isDeleted,
        })),
        total: result.total,
        limit,
        offset,
      },
    };
  });
};

/**
 * Get workspace detail implementation
 */
const getWorkspaceImpl = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.workspaces.get.handler(async ({ input }) => {
    const workspaceDetail = await adminWorkspaceService.getWorkspaceDetail(
      input.params.workspaceId
    );

    return {
      message: 'Workspace retrieved successfully',
      data: formatWorkspaceDetail(workspaceDetail),
    };
  });
};

/**
 * List workspace members implementation
 */
const listWorkspaceMembersImpl = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized
    .use(adminMiddleware)
    .admin.workspaces.members.list.handler(async ({ input }) => {
      const { limit, offset } = input.query;
      const result = await adminWorkspaceService.listWorkspaceMembers(input.params.workspaceId, {
        limit,
        offset,
      });

      return {
        message: 'Members retrieved successfully',
        data: {
          members: result.members.map(formatWorkspaceMember),
          total: result.total,
          limit,
          offset,
        },
      };
    });
};

/**
 * Deactivate workspace implementation
 */
const deactivateWorkspaceImpl = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.workspaces.deactivate.handler(async ({ input }) => {
    const workspaceDetail = await adminWorkspaceService.deactivateWorkspace(
      input.params.workspaceId
    );

    return {
      message: 'Workspace deactivated successfully',
      data: formatWorkspaceDetail(workspaceDetail),
    };
  });
};

/**
 * Reactivate workspace implementation
 */
const reactivateWorkspaceImpl = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.workspaces.reactivate.handler(async ({ input }) => {
    const workspaceDetail = await adminWorkspaceService.reactivateWorkspace(
      input.params.workspaceId
    );

    return {
      message: 'Workspace reactivated successfully',
      data: formatWorkspaceDetail(workspaceDetail),
    };
  });
};

/**
 * Reset invite token implementation
 */
const resetInviteTokenImpl = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized
    .use(adminMiddleware)
    .admin.workspaces.resetInviteToken.handler(async ({ input }) => {
      const workspaceDetail = await adminWorkspaceService.resetInviteToken(
        input.params.workspaceId
      );

      return {
        message: 'Invite token reset successfully',
        data: formatWorkspaceDetail(workspaceDetail),
      };
    });
};

// ============================================
// WORKSPACE RECORDING STATS PROCEDURES
// ============================================

/**
 * Get workspace recording stats implementation
 */
const getWorkspaceRecordingStatsImpl = (
  adminService: AdminService,
  adminRecordingService: AdminRecordingService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized
    .use(adminMiddleware)
    .admin.workspaces.recordingStats.handler(async ({ input }) => {
      const { filterUploadStatus, filterStreamingStatus, filterDeleted, weeksToShow } = input.query;

      const stats = await adminRecordingService.getWorkspaceRecordingStats({
        workspaceId: input.params.workspaceId,
        filterUploadStatus,
        filterStreamingStatus,
        filterDeleted,
        weeksToShow,
      });

      return {
        message: 'Workspace recording stats retrieved successfully',
        data: stats,
      };
    });
};

/**
 * Get workspace member recording stats implementation
 */
const getWorkspaceMemberRecordingStatsImpl = (
  adminService: AdminService,
  adminRecordingService: AdminRecordingService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized
    .use(adminMiddleware)
    .admin.workspaces.memberRecordingStats.handler(async ({ input }) => {
      const { filterUploadStatus, filterStreamingStatus, filterDeleted } = input.query;

      const stats = await adminRecordingService.getWorkspaceMemberRecordingStats({
        workspaceId: input.params.workspaceId,
        filterUploadStatus,
        filterStreamingStatus,
        filterDeleted,
      });

      return {
        message: 'Workspace member recording stats retrieved successfully',
        data: stats,
      };
    });
};

// ============================================
// WORKSPACE PROVISIONING PROCEDURES
// ============================================

/**
 * Provision workspace implementation
 */
const provisionWorkspaceImpl = (
  adminService: AdminService,
  adminProvisioningService: AdminProvisioningService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.workspaces.provision.handler(async ({ input }) => {
    const result = await adminProvisioningService.provisionWorkspace({
      owner: input.body.owner,
      workspace: {
        name: input.body.workspace.name,
        url: input.body.workspace.url,
        plan: input.body.workspace.plan,
      },
      members: input.body.members,
    });

    return {
      message: 'Workspace provisioned successfully',
      data: result,
    };
  });
};

/**
 * Create admin procedures
 */
export const createAdminProcedures = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService,
  adminRecordingService: AdminRecordingService,
  adminProvisioningService: AdminProvisioningService
) => {
  return {
    users: {
      search: searchUsersImpl(adminService),
      get: getUserImpl(adminService),
      ban: banUserImpl(adminService),
      unban: unbanUserImpl(adminService),
      sessions: {
        list: listUserSessionsImpl(adminService),
        revokeAll: revokeAllSessionsImpl(adminService),
      },
      workspaces: {
        list: listUserWorkspacesImpl(adminService),
      },
    },
    sessions: {
      revoke: revokeSessionImpl(adminService),
    },
    workspaces: {
      search: searchWorkspacesImpl(adminService, adminWorkspaceService),
      get: getWorkspaceImpl(adminService, adminWorkspaceService),
      members: {
        list: listWorkspaceMembersImpl(adminService, adminWorkspaceService),
      },
      deactivate: deactivateWorkspaceImpl(adminService, adminWorkspaceService),
      reactivate: reactivateWorkspaceImpl(adminService, adminWorkspaceService),
      resetInviteToken: resetInviteTokenImpl(adminService, adminWorkspaceService),
      recordingStats: getWorkspaceRecordingStatsImpl(adminService, adminRecordingService),
      memberRecordingStats: getWorkspaceMemberRecordingStatsImpl(
        adminService,
        adminRecordingService
      ),
      provision: provisionWorkspaceImpl(adminService, adminProvisioningService),
    },
  };
};
