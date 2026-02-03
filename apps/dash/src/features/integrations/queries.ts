import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult, showErrorToast } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

import { integrationKeys } from './query-keys';

/**
 * Hook to fetch Intercom integration status for the current workspace
 * Returns whether Intercom is connected and connection details
 */
export function useIntercomIntegration() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: integrationKeys.intercom(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.integrations.intercom.get({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to initiate Intercom OAuth authorization flow
 * Returns authorization URL that user should be redirected to
 */
export function useIntercomAuthorize() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.integrations.intercom.authorize({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
      // Redirect to Intercom OAuth page
      window.location.href = result.data.authorizationUrl;
    },
    onSettled: () => {
      // Invalidate integration status after authorization attempt
      queryClient.invalidateQueries({ queryKey: integrationKeys.intercom(workspaceId ?? '') });
    },
  });
}

/**
 * Hook to disconnect Intercom integration from the workspace
 */
export function useIntercomDisconnect() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.integrations.intercom.delete({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
      // Invalidate integration status after disconnect
      queryClient.invalidateQueries({ queryKey: integrationKeys.intercom(workspaceId ?? '') });
    },
  });
}

/**
 * Hook to fetch Intercom admins for a workspace
 * @param workspaceId - The workspace ID to fetch admins for
 * @param excludeMembers - If true, excludes admins who are already workspace members (default: true)
 */
export function useIntercomAdmins(workspaceId: string | null, excludeMembers: boolean = true) {
  return useQuery({
    queryKey: integrationKeys.intercomAdmins(workspaceId ?? '', excludeMembers),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.integrations.intercom.admins({
        params: { workspaceId },
        query: { exclude_members: excludeMembers },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 1 * 60 * 1000, // 1 minute - admins list can change
    retry: 1,
  });
}
