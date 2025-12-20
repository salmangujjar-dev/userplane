import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';

interface WorkspacePreferences {
  recordingCustomizeLink: boolean;
  recordingCompanyName?: string | null;
  recordingCompanyLogoPath?: string | null;
  recordingHeader?: string | null;
  recordingFootnote?: string | null;
  recordingPrimaryColor?: string | null;
}

export function useUpdateToggle(
  workspaceId: string | null,
  onError?: (previousValue: boolean) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.preferences.update({
        params: { workspaceId },
        body: { recordingCustomizeLink: enabled },
      });
      if (error) throw error;
      return response.data;
    },
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-preferences', workspaceId] });
      const previousPreferences = queryClient.getQueryData(['workspace-preferences', workspaceId]);
      queryClient.setQueryData(
        ['workspace-preferences', workspaceId],
        (old: WorkspacePreferences | undefined) => {
          if (!old) return old;
          return {
            ...old,
            recordingCustomizeLink: enabled,
          };
        }
      );
      return { previousPreferences };
    },
    onError: (error: Error, enabled, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          ['workspace-preferences', workspaceId],
          context.previousPreferences
        );
        const previousValue =
          (context.previousPreferences as WorkspacePreferences)?.recordingCustomizeLink ?? false;
        if (onError) {
          onError(previousValue);
        }
      }
      toast.error(`Failed to update customization: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Recording link customization updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-preferences', workspaceId] });
    },
  });
}

export function useUpdateAppearance(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      recordingCompanyName?: string | null;
      recordingCompanyLogoPath?: string | null;
      recordingHeader?: string | null;
      recordingFootnote?: string | null;
      recordingPrimaryColor?: string | null;
    }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.preferences.update({
        params: { workspaceId },
        body: updates,
      });
      if (error) throw error;
      return response.data;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-preferences', workspaceId] });
      const previousPreferences = queryClient.getQueryData(['workspace-preferences', workspaceId]);
      queryClient.setQueryData(
        ['workspace-preferences', workspaceId],
        (old: WorkspacePreferences | undefined) => {
          if (!old) return old;
          return {
            ...old,
            ...updates,
          };
        }
      );
      return { previousPreferences };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          ['workspace-preferences', workspaceId],
          context.previousPreferences
        );
      }
      toast.error(`Failed to update settings: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Appearance settings updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-preferences', workspaceId] });
    },
  });
}
