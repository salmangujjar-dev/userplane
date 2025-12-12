/**
 * Workspace API Data Types
 * Data types for workspace-related API responses
 */

import type { PaginationMeta } from './common';
import type { LinkSettings } from './workspace.service';

export interface WorkspaceData {
  workspaceId: string;
  workspaceName: string;
  recordingSlug: string;
}

export interface WorkspacesListData {
  workspaces: WorkspaceListItemData[];
  total: number;
  pagination: PaginationMeta;
}

/**
 * Workspace list item - flexible to accommodate various include options
 * The API may return additional fields based on query parameters
 */
export interface WorkspaceListItemData {
  [key: string]: unknown;
}

export interface WorkspaceByIdData {
  workspace: {
    id: string;
    workspaceName: string;
    workspacePlan: string;
    createdAt: Date;
    updatedAt: Date;
    recordingSlug?: string;
    [key: string]: unknown;
  };
}

export interface WorkspacePreferencesData {
  workspaceId: string;
  recordingCustomizeLink: boolean;
  recordingHideSensitive: boolean;
  recordingCaptureClientLog: boolean;
  recordingCaptureServerLog: boolean;
}

export interface WorkspacePreferencesGetData {
  preferences: {
    recordingCustomizeLink: boolean;
    recordingHideSensitive: boolean;
    recordingCaptureClientLog: boolean;
    recordingCaptureServerLog: boolean;
    recordingCompanyName: string | null;
    recordingCompanyLogoPath: string | null;
    recordingHeader: string | null;
    recordingFootnote: string | null;
    recordingPrimaryColor: string | null;
    recordingMaxDuration: number | null;
    recordingSlug: string;
    [key: string]: unknown;
  };
}

export interface WorkspacePreferencesUpdateData {
  workspaceId: string;
}

export interface WorkspaceNameUpdateData {
  workspaceId: string;
  workspaceName: string;
}

export interface WorkspaceDeleteData {
  workspaceId: string;
}

/**
 * Link Settings API Data Types
 */
export interface LinkSettingsData extends LinkSettings {}

/**
 * Workspace count data
 */
export interface WorkspaceCountData {
  count: number;
}
