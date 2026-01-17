import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';

/**
 * Hook to fetch recording details by ID
 * Returns recording metadata and basic information
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecording(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: ['recording', workspaceId, recordingId],
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.getById({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch recording video resource
 * Returns presigned URL for video playback
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecordingVideo(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: ['recording-video', workspaceId, recordingId],
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.resources.video({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 50 * 60 * 1000, // 50 minutes (presigned URLs typically last 1 hour)
    retry: 2,
  });
}

/**
 * Hook to fetch recording thumbnail resource
 * Returns presigned URL for thumbnail image
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecordingThumbnail(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: ['recording-thumbnail', workspaceId, recordingId],
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.resources.thumbnail({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 50 * 60 * 1000, // 50 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch recording console log resource
 * Returns presigned URL for console log file
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecordingConsoleLog(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: ['recording-console-log', workspaceId, recordingId],
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.resources.consoleLog({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 50 * 60 * 1000, // 50 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch recording network log resource
 * Returns presigned URL for network log file
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecordingNetworkLog(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: ['recording-network-log', workspaceId, recordingId],
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.resources.networkLog({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 50 * 60 * 1000, // 50 minutes
    retry: 2,
  });
}
