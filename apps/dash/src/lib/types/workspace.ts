/**
 * Workspace-related types
 */

import type { WorkspaceInvitePolicy } from '@workspace/contract';

/**
 * Workspace notification preferences
 */
export interface WorkspaceNotifications {
  notifyOnLinkUsage?: boolean;
  notifyOnQuotaReset?: boolean;
  notifyOnQuotaLimit?: boolean;
  notifyOnMemberJoin?: boolean;
  notifyOnInviteAccepted?: boolean;
}

/**
 * Workspace item in list
 */
export interface WorkspaceItem {
  workspaceId: string;
  workspaceName: string;
  notificationPreferences?: WorkspaceNotifications;
}

/**
 * Workspaces list response
 */
export interface WorkspacesData {
  workspaces: WorkspaceItem[];
  total: number;
}

/**
 * Workspace detail response
 */
export interface WorkspaceData {
  workspace: {
    workspaceId: string;
    workspaceName: string;
  };
}

/**
 * Workspace preferences
 */
export interface WorkspacePreferences {
  recordingCustomizeLink: boolean;
  recordingCompanyName?: string | null;
  recordingCompanyLogoPath?: string | null;
  recordingHeader?: string | null;
  recordingFootnote?: string | null;
  recordingPrimaryColor?: string | null;
}

/**
 * Re-export WorkspaceInvitePolicy from contract for convenience
 */
export type { WorkspaceInvitePolicy };

/**
 * Workspace invite policy data
 */
export interface InvitePolicyData {
  workspaceId: string;
  workspaceInvitePolicy: WorkspaceInvitePolicy;
  workspaceInviteDomains: string[] | null;
}

/**
 * Workspace billing email data
 */
export interface WorkspaceBillingEmailData {
  workspaceId: string;
  workspaceBillingEmail: string;
}

/**
 * Workspace notification preferences response
 */
export interface NotificationPreferencesData {
  notificationPreferences: WorkspaceNotifications;
}

/**
 * Workspace invite URL response
 */
export interface InviteUrlData {
  inviteUrl: string;
}

/**
 * Join workspace response
 */
export interface JoinWorkspaceData {
  workspaceId: string;
  workspaceName: string;
  status: 'joined' | 'requested';
}

/**
 * Leave workspace response
 */
export interface LeaveWorkspaceData {
  workspaceId: string;
  workspaceDeleted?: boolean;
}
