import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

export interface WorkspacePreferences {
  workspaceId: string;
  recordingCustomizeLink: boolean;
  recordingCompanyName: string | null;
  recordingCompanyLogoPath: string | null;
  recordingHeader: string | null;
  recordingFootnote: string | null;
  recordingPrimaryColor: string | null;
  recordingMaxDurationMs: number | null;
  recordingSlug: string;
}

/**
 * Hook to fetch workspace preferences and recording link settings
 * Returns customization settings for recording links
 */
export function useWorkspacePreferences() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: ['workspace-preferences', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const response = await apiClient.workspace.preferences.get({
        params: { workspaceId },
      });
      return response.data.preferences;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
