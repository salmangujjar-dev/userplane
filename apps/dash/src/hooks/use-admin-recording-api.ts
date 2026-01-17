'use client';

/**
 * Admin Recording API Hooks
 * React Query hooks for admin workspace recording stats operations
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';

// Query keys for cache management
export const adminRecordingKeys = {
  all: ['admin-recordings'] as const,
  workspaceStats: (
    workspaceId: string,
    filters?: {
      filterUploadStatus?: string;
      filterStreamingStatus?: string;
      filterDeleted?: string;
    }
  ) => [...adminRecordingKeys.all, 'workspace-stats', workspaceId, filters] as const,
  workspaceMemberStats: (
    workspaceId: string,
    filters?: {
      filterUploadStatus?: string;
      filterStreamingStatus?: string;
      filterDeleted?: string;
    }
  ) => [...adminRecordingKeys.all, 'member-stats', workspaceId, filters] as const,
};

/**
 * Get workspace recording stats for charts
 */
export function useAdminWorkspaceRecordingStats(
  workspaceId: string | null,
  filters?: {
    filterUploadStatus?: 'pending' | 'available' | 'expired' | 'purged';
    filterStreamingStatus?: 'pending' | 'available' | 'failed' | 'expired' | 'purged';
    filterDeleted?: 'all' | 'active' | 'deleted';
    weeksToShow?: '12' | '24' | '36' | '48';
  }
) {
  return useQuery({
    queryKey: adminRecordingKeys.workspaceStats(workspaceId ?? '', filters),
    queryFn: async () => {
      if (!workspaceId) return null;

      const [error, response] = await apiClient.admin.workspaces.recordingStats({
        params: { workspaceId },
        query: filters ?? {},
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get workspace member recording stats for pie chart
 */
export function useAdminWorkspaceMemberRecordingStats(
  workspaceId: string | null,
  filters?: {
    filterUploadStatus?: 'pending' | 'available' | 'expired' | 'purged';
    filterStreamingStatus?: 'pending' | 'available' | 'failed' | 'expired' | 'purged';
    filterDeleted?: 'all' | 'active' | 'deleted';
  }
) {
  return useQuery({
    queryKey: adminRecordingKeys.workspaceMemberStats(workspaceId ?? '', filters),
    queryFn: async () => {
      if (!workspaceId) return null;

      const [error, response] = await apiClient.admin.workspaces.memberRecordingStats({
        params: { workspaceId },
        query: filters ?? {},
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
}
