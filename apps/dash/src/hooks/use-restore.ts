import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';

interface RestoreWorkspaceInput {
  workspaceId: string;
}

interface RestoreWorkspaceData {
  workspace: {
    workspaceId: string;
    workspaceName: string;
    isDeleted: boolean;
    deletedAt: string | null;
    deletedSince: number | null;
  };
  restoredProjects: number;
  restoredLinks: number;
  restoredMembers: number;
  restoredRecordings: number;
}

interface RestoreProjectInput {
  workspaceId: string;
  projectId: string;
}

interface RestoreProjectData {
  workspaceId: string;
  project: {
    projectId: string;
    projectTitle: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    deletedAt: string | null;
    deletedSince: number | null;
  };
}

/**
 * Hook to restore a deleted workspace
 * Restores workspace and associated projects/links
 */
export function useRestoreWorkspace() {
  return useMutation<SafeResult<RestoreWorkspaceData>, Error, RestoreWorkspaceInput>({
    mutationFn: async (input: RestoreWorkspaceInput) => {
      const [error, response] = await apiClient.workspace.restore({
        params: { workspaceId: input.workspaceId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to restore workspace');
    },
  });
}

/**
 * Hook to restore a deleted project
 * Restores project within its workspace
 */
export function useRestoreProject() {
  return useMutation<SafeResult<RestoreProjectData>, Error, RestoreProjectInput>({
    mutationFn: async (input: RestoreProjectInput) => {
      const [error, response] = await apiClient.project.restore({
        params: { workspaceId: input.workspaceId, projectId: input.projectId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to restore project');
    },
  });
}

export type { RestoreProjectData, RestoreWorkspaceData };
