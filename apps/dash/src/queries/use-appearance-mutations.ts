import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { handleApiError, handleSafeResult, type SafeResult } from '@/lib/errors';

interface WorkspacePreferences {
  recordingCustomizeLink: boolean;
  recordingCompanyName?: string | null;
  recordingCompanyLogoPath?: string | null;
  recordingHeader?: string | null;
  recordingFootnote?: string | null;
  recordingPrimaryColor?: string | null;
}

interface UpdateToggleData {
  updated: boolean;
}

export function useUpdateToggle(workspaceId: string | null, onError?: () => void) {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<UpdateToggleData>, Error, boolean>({
    mutationFn: async (enabled: boolean) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.preferences.update({
        params: { workspaceId },
        body: { recordingCustomizeLink: enabled },
      });
      return handleSafeResult(error, response?.data ? { updated: true } : null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to update customization');
        // Invalidate to restore server state on API error
        queryClient.invalidateQueries({ queryKey: ['workspace-preferences', workspaceId] });
        onError?.();
        return;
      }
      toast.success('Recording link customization updated');
    },
    onError: (error: unknown) => {
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
      // Invalidate to restore server state on network error
      queryClient.invalidateQueries({ queryKey: ['workspace-preferences', workspaceId] });
      onError?.();
    },
  });
}

interface AppearanceUpdates {
  recordingCompanyName?: string | null;
  recordingCompanyLogoPath?: string | null;
  recordingHeader?: string | null;
  recordingFootnote?: string | null;
  recordingPrimaryColor?: string | null;
}

interface UpdateAppearanceData {
  updated: boolean;
}

export function useUpdateAppearance(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateAppearanceData>,
    Error,
    AppearanceUpdates,
    { previousPreferences: WorkspacePreferences | undefined }
  >({
    mutationFn: async (updates: AppearanceUpdates) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.preferences.update({
        params: { workspaceId },
        body: updates,
      });
      return handleSafeResult(error, response?.data ? { updated: true } : null);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-preferences', workspaceId] });
      const previousPreferences = queryClient.getQueryData<WorkspacePreferences>([
        'workspace-preferences',
        workspaceId,
      ]);
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
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousPreferences) {
          queryClient.setQueryData(
            ['workspace-preferences', workspaceId],
            context.previousPreferences
          );
        }
        handleApiError(result.error, 'Failed to update settings');
        return;
      }
      toast.success('Appearance settings updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          ['workspace-preferences', workspaceId],
          context.previousPreferences
        );
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-preferences', workspaceId] });
    },
  });
}
