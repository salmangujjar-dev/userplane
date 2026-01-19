import { useMutation } from '@tanstack/react-query';
import type {
  ProjectRestoreData,
  RestorationStatus,
  WorkspaceRestoreData,
} from '@workspace/contract';

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

interface RestoreProjectInput {
  workspaceId: string;
  projectId: string;
}

// Client-side types with dates as strings (after JSON serialization)
type WorkspaceRestoreDataClient = Omit<WorkspaceRestoreData, 'workspace'> & {
  workspace: Omit<WorkspaceRestoreData['workspace'], 'deletedAt'> & {
    deletedAt: string | null;
  };
};

type ProjectRestoreDataClient = Omit<ProjectRestoreData, 'project'> & {
  project: Omit<ProjectRestoreData['project'], 'deletedAt' | 'createdAt' | 'updatedAt'> & {
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

/**
 * Hook to restore a deleted workspace
 * Restores workspace and associated projects/links
 */
export function useRestoreWorkspace() {
  return useMutation<SafeResult<WorkspaceRestoreDataClient>, Error, RestoreWorkspaceInput>({
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
  return useMutation<SafeResult<ProjectRestoreDataClient>, Error, RestoreProjectInput>({
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

// Re-export types from contract and client-side types
export type { ProjectRestoreDataClient, RestorationStatus, WorkspaceRestoreDataClient };
