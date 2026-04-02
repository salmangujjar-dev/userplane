/**
 * Workspace-related types
 * Re-exports from @userplane/contract for type consistency
 */

import type {
  IncomingEventChannels,
  JoinWorkspaceDataSchema,
  LeaveWorkspaceDataSchema,
  WorkspaceItem,
  WorkspaceNotificationPreferences,
} from '@userplane/contract';
import type { z } from 'zod';

/**
 * Workspace notification preferences (partial for updates)
 * notifyIncomingEvents accepts partial channels for per-channel toggles
 */
export type WorkspaceNotifications = Partial<
  Omit<WorkspaceNotificationPreferences, 'notifyIncomingEvents'> & {
    notifyIncomingEvents: Partial<IncomingEventChannels>;
  }
>;

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
} from '@userplane/contract';

// Aliases for backward compatibility
export type { SuggestedWorkspaceItem as SuggestedWorkspace } from '@userplane/contract';
export type { SuggestWorkspacesData as WorkspaceSuggestionsData } from '@userplane/contract';
export type { WorkspaceResourcesCountData as WorkspaceResourceCountsData } from '@userplane/contract';

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
  availableChannels: string[];
}

/**
 * Join workspace response - pinned to contract
 */
export type JoinWorkspaceData = z.infer<typeof JoinWorkspaceDataSchema>;

/**
 * Leave workspace response - pinned to contract
 */
export type LeaveWorkspaceData = z.infer<typeof LeaveWorkspaceDataSchema>;
