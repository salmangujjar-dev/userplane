/**
 * Admin route implementations
 * Handlers for admin user, workspace, and recording management operations
 */

import { isValidRoleName } from '@workspace/auth';
import type { WorkspaceRole } from '@workspace/contract';
import type { ResourceLimits, ResourceType } from '@workspace/pricing';

import { generateWorkspaceId } from '@/api/lib/id';
import { createAdminMiddleware } from '@/api/middleware/admin.orpc';
import { authorized } from '@/api/middleware/auth.orpc';
import { authWithAdminRateLimit } from '@/api/middleware/rate-limit.orpc';
import type { AdminService } from '@/api/services/admin.service';
import type { AdminPlanService } from '@/api/services/admin-plan.service';
import type { AdminProjectService } from '@/api/services/admin-project.service';
import type { AdminRecordingService } from '@/api/services/admin-recording.service';
import type { AdminSubscriptionService } from '@/api/services/admin-subscription.service';
import type { AdminWorkspaceService } from '@/api/services/admin-workspace.service';
import type { BillingService } from '@/api/services/billing.service';
import type { EmailService } from '@/api/services/email.service';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { ProjectService } from '@/api/services/project.service';
import type { TokenService } from '@/api/services/token.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { calculateScheduledTime, getRestorationMaxWindowDays } from '@/api/utils/date';
import { formatDeletionDate } from '@/api/utils/format';

/**
 * Format date to Date object (or null)
 */
function formatDate(date: Date | string | null): Date | null {
  return date ? new Date(date) : null;
}

/**
 * Format session for response
 */
function formatSession(session: {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date | string;
  expiresAt: Date | string;
  impersonatedBy: string | null;
}) {
  return {
    id: session.id,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: new Date(session.createdAt),
    expiresAt: new Date(session.expiresAt),
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
  banExpires: Date | string | null;
  emailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
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
    createdAt: new Date(user.createdAt),
    workspaceCount: user.workspaceCount,
  };
}

/**
 * Format user workspace for response
 */
function formatUserWorkspace(workspace: {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: WorkspaceRole;
  joinedAt: Date | string;
}) {
  return {
    workspaceId: workspace.workspaceId,
    workspaceName: workspace.workspaceName,
    workspaceRole: workspace.workspaceRole,
    joinedAt: new Date(workspace.joinedAt),
  };
}

/**
 * Search users implementation
 */
const searchUsersImpl = (adminService: AdminService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.users.search.handler(async ({ input, context }) => {
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
            createdAt: new Date(u.createdAt),
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

  return authWithAdminRateLimit.use(adminMiddleware).admin.users.get.handler(async ({ input }) => {
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
const banUserImpl = (adminService: AdminService, emailService: EmailService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.users.ban.handler(async ({ input, context }) => {
      const userDetail = await adminService.banUser(input.params.userId, context.user.id, {
        reason: input.body.reason,
        expiresInSeconds: input.body.expiresInSeconds,
        deleteWorkspacesForRoles: input.body.deleteWorkspacesForRoles,
      });

      // Send email to suspended account
      await emailService.sendSafeTosViolation({ to: userDetail.email });

      return {
        message: 'User banned successfully',
        data: formatUserDetail(userDetail),
      };
    });
};

/**
 * Unban user implementation
 */
const unbanUserImpl = (adminService: AdminService, emailService: EmailService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.users.unban.handler(async ({ input }) => {
      const userDetail = await adminService.unbanUser(input.params.userId);

      // Send account restored email
      await emailService.sendSafeAccountRestored({ to: userDetail.email });

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

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.users.sessions.list.handler(async ({ input }) => {
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

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.sessions.revoke.handler(async ({ input }) => {
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

  return authWithAdminRateLimit
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

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.users.workspaces.list.handler(async ({ input }) => {
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
  joinedAt: Date | string;
}) {
  return {
    userId: member.userId,
    userName: member.userName,
    userEmail: member.userEmail,
    workspaceRole: member.workspaceRole,
    joinedAt: new Date(member.joinedAt),
  };
}

/**
 * Format workspace detail for response
 * Note: Members are fetched separately via listWorkspaceMembers endpoint
 * Plan is derived from subscription status, not stored on workspace
 */
function formatWorkspaceDetail(workspace: {
  workspaceId: string;
  workspaceName: string;
  createdAt: Date | string;
  isDeleted: boolean;
  deletedAt: Date | string | null;
  memberCount: number;
  projectCount: number;
  domainCount: number;
  linkCount: number;
  recordingCount: number;
}) {
  return {
    workspaceId: workspace.workspaceId,
    workspaceName: workspace.workspaceName,
    createdAt: new Date(workspace.createdAt),
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

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.workspaces.search.handler(async ({ input }) => {
      const { search, limit, offset, sortBy, sortDirection, filterStatus } = input.query;

      const result = await adminWorkspaceService.searchWorkspaces({
        search,
        limit,
        offset,
        sortBy,
        sortDirection,
        filterStatus,
      });

      return {
        message: 'Workspaces retrieved successfully',
        data: {
          workspaces: result.workspaces.map((w) => ({
            workspaceId: w.workspaceId,
            workspaceName: w.workspaceName,
            createdAt: new Date(w.createdAt),
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

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.workspaces.get.handler(async ({ input }) => {
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
 * Format workspace project for response
 */
function formatWorkspaceProject(project: {
  projectId: string;
  projectTitle: string;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  recordingCount: number;
}) {
  return {
    projectId: project.projectId,
    projectTitle: project.projectTitle,
    isDefault: project.isDefault,
    isDeleted: project.isDeleted,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    deletedAt: formatDate(project.deletedAt),
    recordingCount: project.recordingCount,
  };
}

/**
 * Search workspace projects implementation
 */
const searchWorkspaceProjectsImpl = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized
    .use(adminMiddleware)
    .admin.workspaces.projects.list.handler(async ({ input }) => {
      const { search, limit, offset, sortBy, sortDirection, filterStatus } = input.query;
      const result = await adminWorkspaceService.searchWorkspaceProjects({
        workspaceId: input.params.workspaceId,
        search,
        limit,
        offset,
        sortBy,
        sortDirection,
        filterStatus,
      });

      return {
        message: 'Projects retrieved successfully',
        data: {
          projects: result.projects.map(formatWorkspaceProject),
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
  adminWorkspaceService: AdminWorkspaceService,
  workspaceMemberService: WorkspaceMemberService,
  emailService: EmailService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.workspaces.deactivate.handler(async ({ input }) => {
      // Get workspace info before deactivation for email
      const workspaceInfo = await adminWorkspaceService.getWorkspaceDetail(
        input.params.workspaceId
      );

      const workspaceDetail = await adminWorkspaceService.deactivateWorkspace(
        input.params.workspaceId
      );

      // Check if notifications are enabled
      const notify = input.body?.notify;
      if (notify && notify !== 'never') {
        // Calculate deletion date using restoration max window
        const deletionDate = new Date();
        const maxWindow = getRestorationMaxWindowDays();
        deletionDate.setDate(deletionDate.getDate() + maxWindow);
        const formattedDeletionDate = formatDeletionDate(deletionDate);

        // Calculate scheduled time based on notify duration
        const scheduledAt = calculateScheduledTime(notify);

        // Send deletion scheduled email to workspace owners using batch API
        const owners = await workspaceMemberService.getOwners(input.params.workspaceId);
        const ownerEmails = owners.map((owner) => owner.email);
        await emailService.sendSafeWorkspaceDeletionScheduled(
          { to: ownerEmails },
          {
            workspaceName: workspaceInfo.workspaceName,
            deletionDate: formattedDeletionDate,
            workspaceId: input.params.workspaceId,
            scheduledAt,
          }
        );
      }

      return {
        message: 'Workspace deactivated successfully',
        data: formatWorkspaceDetail(workspaceDetail),
      };
    });
};

/**
 * Restore workspace implementation
 * Uses WorkspaceService.restoreWorkspace for consistent restoration logic
 */
const restoreWorkspaceImpl = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService,
  workspaceMemberService: WorkspaceMemberService,
  emailService: EmailService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.workspaces.restore.handler(async ({ input }) => {
      const result = await adminWorkspaceService.restoreWorkspace(input.params.workspaceId);

      // Check if notifications are enabled
      const notify = input.body?.notify;
      if (notify && notify !== 'never') {
        // Calculate scheduled time based on notify duration
        const scheduledAt = calculateScheduledTime(notify);

        // Send email to workspace owners that the workspace has been restored
        const owners = await workspaceMemberService.getOwners(input.params.workspaceId);

        // Send appropriate email based on restoration status using batch
        const ownerEmails = owners.map((owner) => owner.email);
        const emailMethod =
          result.restorationStatus === 'partial'
            ? emailService.sendSafeWorkspaceRecoveryPartially
            : emailService.sendSafeWorkspaceRecoveryConfirmation;

        // Use batch sending via Resend's batch API for multiple recipients
        await emailMethod(
          { to: ownerEmails },
          {
            workspaceName: result.workspace.workspaceName,
            workspaceId: input.params.workspaceId,
            scheduledAt,
          }
        );
      }

      return {
        message: 'Workspace restored successfully',
        data: {
          workspace: {
            workspaceId: result.workspace.workspaceId,
            workspaceName: result.workspace.workspaceName,
            isDeleted: result.workspace.isDeleted,
            deletedAt: formatDate(result.workspace.deletedAt),
          },
          restoredProjects: result.restoredProjects,
          restoredLinks: result.restoredLinks,
        },
      };
    });
};

/**
 * Deactivate project implementation
 * Uses AdminProjectService.deactivateProject for consistent deletion logic
 */
const deactivateProjectImpl = (
  adminService: AdminService,
  adminProjectService: AdminProjectService,
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  emailService: EmailService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.projects.deactivate.handler(async ({ input }) => {
      // Get project info before deletion for email
      const project = await projectService.getById(input.params.projectId);

      await adminProjectService.deactivateProject(input.params.projectId, input.params.workspaceId);

      // Check if notifications are enabled
      const notify = input.body?.notify;
      if (notify && notify !== 'never') {
        // Calculate deletion date using restoration max window
        const deletionDate = new Date();
        const maxWindow = getRestorationMaxWindowDays();
        deletionDate.setDate(deletionDate.getDate() + maxWindow);
        const formattedDeletionDate = formatDeletionDate(deletionDate);

        // Calculate scheduled time based on notify duration
        const scheduledAt = calculateScheduledTime(notify);

        // Send deletion scheduled email to workspace owners using batch
        const owners = await workspaceMemberService.getOwners(input.params.workspaceId);
        const ownerEmails = owners.map((owner) => owner.email);

        // Use batch sending via Resend's batch API for multiple recipients
        await emailService.sendSafeProjectDeletionScheduled(
          { to: ownerEmails },
          {
            projectName: project.projectTitle || 'Untitled Project',
            deletionDate: formattedDeletionDate,
            workspaceId: input.params.workspaceId,
            projectId: input.params.projectId,
            scheduledAt,
          }
        );
      }

      return {
        message: 'Project deactivated successfully',
        data: {
          workspaceId: input.params.workspaceId,
          projectId: input.params.projectId,
        },
      };
    });
};

/**
 * Restore project implementation
 * Uses AdminProjectService.restoreProject for consistent restoration logic
 */
const restoreProjectImpl = (
  adminService: AdminService,
  adminProjectService: AdminProjectService,
  workspaceMemberService: WorkspaceMemberService,
  emailService: EmailService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.projects.restore.handler(async ({ input }) => {
      const restoredProject = await adminProjectService.restoreProject(input.params.projectId);

      // Check if notifications are enabled
      const notify = input.body?.notify;
      if (notify && notify !== 'never') {
        // Calculate scheduled time based on notify duration
        const scheduledAt = calculateScheduledTime(notify);

        // Send email to workspace owners that the project has been restored
        const owners = await workspaceMemberService.getOwners(input.params.workspaceId);

        // Send appropriate email based on restoration status
        const ownerEmails = owners.map((owner) => owner.email);
        const emailMethod =
          restoredProject.restorationStatus === 'partial'
            ? emailService.sendSafeProjectRecoveryPartially
            : emailService.sendSafeProjectRecoveryConfirmation;

        // Use batch sending via Resend's batch API for multiple recipients
        await emailMethod(
          { to: ownerEmails },
          {
            projectName: restoredProject.projectTitle,
            workspaceId: input.params.workspaceId,
            scheduledAt,
          }
        );
      }

      return {
        message: 'Project restored successfully',
        data: {
          workspaceId: input.params.workspaceId,
          project: {
            projectId: restoredProject.projectId,
            projectTitle: restoredProject.projectTitle,
            isDefault: restoredProject.isDefault,
            createdAt: new Date(restoredProject.createdAt),
            updatedAt: new Date(restoredProject.updatedAt),
          },
        },
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

  return authWithAdminRateLimit
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

/**
 * Create workspace invite implementation
 */
const createWorkspaceInviteImpl = (
  adminService: AdminService,
  tokenService: TokenService,
  emailService: EmailService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.workspace.createInvite.handler(async ({ input }) => {
      // Generate a predetermined workspace ID using standard ID generator
      const workspaceId = generateWorkspaceId();
      const notify = input.body.notify || 'never';

      // Generate workspace create invite URL
      // Workspaces start on free plan - users upgrade via subscription
      const inviteUrl = tokenService.generateWorkspaceCreateInviteUrl({
        workspaceId,
        workspaceUrl: input.body.workspaceUrl,
      });

      // Send email if notify is not 'never' and email is provided
      const email = input.body.email;
      if (notify !== 'never' && email) {
        // Calculate scheduled time based on notify duration
        const scheduledAt = calculateScheduledTime(notify);

        // Send workspace invite email (immediate or scheduled)
        await emailService.sendSafeWorkspaceInvite(
          { to: email },
          {
            inviteUrl,
            scheduledAt,
          }
        );
      }

      return {
        message: 'Workspace invite generated successfully',
        data: {
          inviteUrl,
          workspaceId,
          workspaceUrl: input.body.workspaceUrl,
        },
      };
    });
};

// ============================================
// ENTITLEMENT PROCEDURES
// ============================================

/**
 * Get workspace entitlements implementation
 */
const getWorkspaceEntitlementsImpl = (
  adminService: AdminService,
  entitlementService: EntitlementService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized
    .use(adminMiddleware)
    .admin.workspaces.entitlements.get.handler(async ({ input }) => {
      const entitlements = await entitlementService.getAllEntitlements(input.params.workspaceId);

      return {
        message: 'Entitlements retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          entitlements: entitlements.map((e) => ({
            resourceType: e.resourceType,
            quotedLimit: e.quotedLimit,
            actualLimit: e.actualLimit,
            resourceConsumed: e.resourceConsumed,
          })),
        },
      };
    });
};

/**
 * Update workspace entitlements implementation
 * Routes through AdminSubscriptionService → DodoPayments metadata so the
 * webhook processor picks up changes via the embedded snapshot mechanism.
 */
const updateWorkspaceEntitlementsImpl = (
  adminService: AdminService,
  adminSubscriptionService: AdminSubscriptionService,
  entitlementService: EntitlementService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.workspaces.entitlements.update.handler(async ({ input }) => {
      // Map array of entitlement items to the overrides shape
      const entitlementOverrides: Partial<Record<ResourceType, Partial<ResourceLimits>>> = {};
      for (const item of input.body.entitlements) {
        const limits: Partial<ResourceLimits> = {};
        if (item.quotedLimit !== undefined) limits.quotedLimit = item.quotedLimit;
        if (item.actualLimit !== undefined) limits.actualLimit = item.actualLimit;
        entitlementOverrides[item.resourceType as ResourceType] = limits;
      }

      await adminSubscriptionService.updateSubscription(input.params.workspaceId, {
        entitlements: entitlementOverrides,
      });

      // Return fresh entitlement state
      const entitlements = await entitlementService.getAllEntitlements(input.params.workspaceId);

      return {
        message: 'Entitlements updated successfully',
        data: {
          workspaceId: input.params.workspaceId,
          entitlements: entitlements.map((e) => ({
            resourceType: e.resourceType,
            quotedLimit: e.quotedLimit,
            actualLimit: e.actualLimit,
            resourceConsumed: e.resourceConsumed,
          })),
        },
      };
    });
};

// ============================================
// PLAN MANAGEMENT PROCEDURES
// ============================================

/**
 * List plans implementation
 */
const listPlansImpl = (adminService: AdminService, adminPlanService: AdminPlanService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.plans.list.handler(async ({ input }) => {
    const result = await adminPlanService.listPlans({
      pageNumber: input.query.pageNumber,
      pageSize: input.query.pageSize,
    });

    return {
      message: 'Plans retrieved successfully',
      data: result,
    };
  });
};

/**
 * Get plan implementation
 */
const getPlanImpl = (adminService: AdminService, adminPlanService: AdminPlanService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized.use(adminMiddleware).admin.plans.get.handler(async ({ input }) => {
    const product = await adminPlanService.getPlan(input.params.productId);

    return {
      message: 'Plan retrieved successfully',
      data: product,
    };
  });
};

/**
 * Create plan implementation
 */
const createPlanImpl = (adminService: AdminService, adminPlanService: AdminPlanService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.plans.create.handler(async ({ input }) => {
      const product = await adminPlanService.createPlan(input.body);

      return {
        message: 'Plan created successfully',
        data: product,
      };
    });
};

/**
 * Update plan implementation
 */
const updatePlanImpl = (adminService: AdminService, adminPlanService: AdminPlanService) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.plans.update.handler(async ({ input }) => {
      const product = await adminPlanService.updatePlan(input.params.productId, input.body);

      return {
        message: 'Plan updated successfully',
        data: product,
      };
    });
};

// ============================================
// WORKSPACE PROVISIONING PROCEDURES
// ============================================

/**
 * Admin workspace provision implementation
 */
const adminProvisionWorkspaceImpl = (
  adminService: AdminService,
  adminWorkspaceService: AdminWorkspaceService,
  emailService: EmailService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.workspaces.provision.handler(async ({ input, context }) => {
      const result = await adminWorkspaceService.provisionWorkspace({
        ...input.body,
        adminRequestHeaders: context.headers,
      });

      if (result.checkoutUrl) {
        await emailService.sendSafeWelcomeEmailCustomSubscription(
          { to: input.body.email },
          {
            workspaceId: result.workspaceId,
            workspaceName: result.workspaceName,
            checkoutUrl: result.checkoutUrl,
          }
        );
      }

      return {
        message: 'Workspace provisioned successfully',
        data: result,
      };
    });
};

// ============================================
// WORKSPACE SUBSCRIPTION PROCEDURES
// ============================================

/**
 * Get workspace subscription implementation
 */
const getWorkspaceSubscriptionImpl = (
  adminService: AdminService,
  billingService: BillingService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authorized
    .use(adminMiddleware)
    .admin.workspaces.subscription.get.handler(async ({ input }) => {
      const { contractDetail, accessDetail, featureGates } =
        await billingService.getSubscriptionStatus(input.params.workspaceId);

      let addons: {
        subscriptionId?: string;
        seatsQuantity: number;
        additionalSeats: number;
        addons: Array<{ addonId: string; quantity: number }>;
      } | null = null;

      try {
        const addonsResult = await billingService.getAddonsStatus(input.params.workspaceId);
        addons = {
          subscriptionId: addonsResult.subscriptionId,
          seatsQuantity: addonsResult.seatsQuantity,
          additionalSeats: addonsResult.additionalSeats,
          addons: addonsResult.addons,
        };
      } catch {
        // No subscription — addons stays null
      }

      return {
        message: 'Subscription retrieved successfully',
        data: {
          contractDetail,
          accessDetail,
          featureGates,
          addons,
        },
      };
    });
};

/**
 * Update workspace subscription implementation
 * Routes overrides through DodoPayments (eventual consistency via webhooks)
 */
const updateWorkspaceSubscriptionImpl = (
  adminService: AdminService,
  adminSubscriptionService: AdminSubscriptionService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.workspaces.subscription.update.handler(async ({ input }) => {
      const result = await adminSubscriptionService.updateSubscription(input.params.workspaceId, {
        featureGates: input.body.featureGates,
        entitlements: input.body.entitlements,
      });

      return {
        message: 'Subscription update submitted. Changes will take effect shortly.',
        data: result,
      };
    });
};

/**
 * Extend workspace trial implementation
 * Pushes next_billing_date forward in DodoPayments
 */
const extendWorkspaceTrialImpl = (
  adminService: AdminService,
  adminSubscriptionService: AdminSubscriptionService
) => {
  const adminMiddleware = createAdminMiddleware(adminService);

  return authWithAdminRateLimit
    .use(adminMiddleware)
    .admin.workspaces.subscription.extendTrial.handler(async ({ input }) => {
      const result = await adminSubscriptionService.extendTrial(
        input.params.workspaceId,
        input.body.extensionDays
      );

      return {
        message: 'Trial extended. Changes will take effect shortly.',
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
  adminProjectService: AdminProjectService,
  adminRecordingService: AdminRecordingService,
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService,
  projectService: ProjectService,
  tokenService: TokenService,
  emailService: EmailService,
  entitlementService: EntitlementService,
  adminPlanService: AdminPlanService,
  billingService: BillingService,
  adminSubscriptionService: AdminSubscriptionService
) => {
  return {
    users: {
      search: searchUsersImpl(adminService),
      get: getUserImpl(adminService),
      ban: banUserImpl(adminService, emailService),
      unban: unbanUserImpl(adminService, emailService),
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
      projects: {
        list: searchWorkspaceProjectsImpl(adminService, adminWorkspaceService),
      },
      deactivate: deactivateWorkspaceImpl(
        adminService,
        adminWorkspaceService,
        workspaceMemberService,
        emailService
      ),
      restore: restoreWorkspaceImpl(
        adminService,
        adminWorkspaceService,
        workspaceMemberService,
        emailService
      ),
      resetInviteToken: resetInviteTokenImpl(adminService, adminWorkspaceService),
      recordingStats: getWorkspaceRecordingStatsImpl(adminService, adminRecordingService),
      memberRecordingStats: getWorkspaceMemberRecordingStatsImpl(
        adminService,
        adminRecordingService
      ),
      entitlements: {
        get: getWorkspaceEntitlementsImpl(adminService, entitlementService),
        update: updateWorkspaceEntitlementsImpl(
          adminService,
          adminSubscriptionService,
          entitlementService
        ),
      },
      subscription: {
        get: getWorkspaceSubscriptionImpl(adminService, billingService),
        update: updateWorkspaceSubscriptionImpl(adminService, adminSubscriptionService),
        extendTrial: extendWorkspaceTrialImpl(adminService, adminSubscriptionService),
      },
      provision: adminProvisionWorkspaceImpl(adminService, adminWorkspaceService, emailService),
    },
    projects: {
      deactivate: deactivateProjectImpl(
        adminService,
        adminProjectService,
        projectService,
        workspaceMemberService,
        emailService
      ),
      restore: restoreProjectImpl(
        adminService,
        adminProjectService,
        workspaceMemberService,
        emailService
      ),
    },
    workspace: {
      createInvite: createWorkspaceInviteImpl(adminService, tokenService, emailService),
    },
    plans: {
      list: listPlansImpl(adminService, adminPlanService),
      get: getPlanImpl(adminService, adminPlanService),
      create: createPlanImpl(adminService, adminPlanService),
      update: updatePlanImpl(adminService, adminPlanService),
    },
  };
};
