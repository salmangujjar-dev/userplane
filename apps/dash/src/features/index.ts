/**
 * Feature exports - centralized exports for all feature modules
 *
 * NOTE: Due to type naming conflicts (PaginationMeta, SortDirection),
 * import from individual features for better type safety:
 *
 * import { workspaceKeys, useWorkspace } from '@/features/workspace';
 * import { projectKeys, useProject } from '@/features/projects';
 *
 * This file exports keys and hooks only (not types) to avoid conflicts.
 */

// Query key factories
export { accountKeys } from './account';
export { adminKeys } from './admin';
export { authKeys } from './auth';
export { billingKeys } from './billing';
export { domainKeys } from './domains';
export { integrationKeys } from './integrations';
export { linkKeys } from './links';
export { projectKeys } from './projects';
export { recordingKeys } from './recordings';
export { workspaceKeys } from './workspace';

// Workspace hooks
export {
  useAcceptInvite,
  useApproveAccessRequest,
  useCanEditWorkspace,
  useCreateWorkspace,
  useDeclineAccessRequest,
  useDeleteWorkspace,
  useInvitePolicy,
  useJoinWorkspace,
  useLeaveWorkspace,
  useRemoveMember,
  useRestoreWorkspace,
  useRotateInvite,
  useSendWorkspaceInvites,
  useUpdateAppearance,
  useUpdateInvitePolicy,
  useUpdateMemberRole,
  useUpdateNotifications,
  useUpdateToggle,
  useUpdateWorkspaceName,
  useValidateAccessRequest,
  useValidateInvite,
  useWorkspace,
  useWorkspaceCount,
  useWorkspaceInvite,
  useWorkspaceMembers,
  useWorkspaceNotifications,
  useWorkspacePreferences,
  useWorkspaceResourceCounts,
  useWorkspaceRestoreInfo,
  useWorkspaceRole,
  useWorkspaces,
  useWorkspaceSearch,
  useWorkspaceStatus,
  useWorkspaceSuggestions,
} from './workspace';

// Project hooks
export {
  useCreateProject,
  useDeleteProject,
  useProject,
  useProjectRestoreInfo,
  useRestoreProject,
  useUpdateProject,
  useWorkspaceProjects,
} from './projects';

// Link hooks
export { useCreateLink, useDeleteLink, useUpdateLink, useWorkspaceLinks } from './links';

// Recording hooks
export {
  useDeleteRecording,
  useGenerateShareToken,
  useRecording,
  useRecordingConsoleLog,
  useRecordingNetworkLog,
  useRecordingThumbnail,
  useRecordingVideo,
  useShareRecording,
  useWorkspaceRecordings,
} from './recordings';

// Domain hooks
export {
  useCreateDomain,
  useDeleteDomain,
  useDomainStatusPolling,
  useSendDomainInstructions,
  useUpdateDomain,
  useUpdateDomainPreferences,
  useWorkspaceDomains,
} from './domains';

// Billing hooks
export { useSubscriptionStatus, useUsageSummary } from './billing';

// Account hooks
export { useAccount, useUpdateAccountName } from './account';

// Auth hooks
export { useSession } from './auth';

// Integration hooks
export {
  useIntercomAuthorize,
  useIntercomDisconnect,
  useIntercomIntegration,
} from './integrations';

// Admin hooks - import from '@/features/admin' for full admin API
export {
  useAdminBanUser,
  useAdminCreateWorkspaceInvite,
  useAdminDeactivateProject,
  useAdminDeactivateWorkspace,
  useAdminResetInviteToken,
  useAdminRestoreProject,
  useAdminRestoreWorkspace,
  useAdminRevokeAllSessions,
  useAdminRevokeSession,
  useAdminSearchUsers,
  useAdminSearchWorkspaceProjects,
  useAdminSearchWorkspaces,
  useAdminUnbanUser,
  useAdminUserDetail,
  useAdminUsers,
  useAdminUserSessions,
  useAdminUserWorkspaces,
  useAdminWorkspaceDetail,
  useAdminWorkspaceMemberRecordingStats,
  useAdminWorkspaceMembers,
  useAdminWorkspaceRecordingStats,
  useImpersonation,
} from './admin';
