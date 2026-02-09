/**
 * Workspace-related types
 * Re-exports from @workspace/contract for type consistency
 */

import type {
  JoinWorkspaceDataSchema,
  LeaveWorkspaceDataSchema,
  WorkspaceItem,
  WorkspaceNotificationPreferences,
} from '@workspace/contract';
import type { z } from 'zod';

/**
 * Workspace notification preferences (partial for updates)
 */
export type WorkspaceNotifications = Partial<WorkspaceNotificationPreferences>;

// Re-export contract types
export type {
  InvitePolicyData,
  InviteUrlData,
  SuggestedWorkspaceItem,
  SuggestWorkspacesData,
  WorkspaceInvitePolicy,
  WorkspaceItem,
  WorkspacePreferences,
  WorkspacePreferencesGetData,
  WorkspaceResourcesCountData,
  WorkspacesListData,
  WorkspaceStatusData,
} from '@workspace/contract';

// Aliases for backward compatibility
export type { SuggestedWorkspaceItem as SuggestedWorkspace } from '@workspace/contract';
export type { SuggestWorkspacesData as WorkspaceSuggestionsData } from '@workspace/contract';
export type { WorkspaceResourcesCountData as WorkspaceResourceCountsData } from '@workspace/contract';

// ============================================
// FRONTEND-SPECIFIC SIMPLIFIED TYPES
// ============================================
// These are intentionally simplified for specific UI components
// Contract types include additional fields (pagination, etc.) not needed

/**
 * Workspace detail response (simplified)
 * Contract equivalent: N/A - used for minimal workspace display
 */
export interface WorkspaceData {
  workspace: {
    workspaceId: string;
    workspaceName: string;
  };
}

/**
 * Workspaces list response (simplified without pagination)
 * Contract equivalent: WorkspacesListData (includes pagination)
 */
export interface WorkspacesData {
  workspaces: WorkspaceItem[];
  total: number;
}

/**
 * Workspace notification preferences response
 */
export interface NotificationPreferencesData {
  notificationPreferences: WorkspaceNotifications;
}

/**
 * Join workspace response - pinned to contract
 */
export type JoinWorkspaceData = z.infer<typeof JoinWorkspaceDataSchema>;

/**
 * Leave workspace response - pinned to contract
 */
export type LeaveWorkspaceData = z.infer<typeof LeaveWorkspaceDataSchema>;
