import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import {
  handleSafeResult,
  handleUnknownError,
  showErrorToast,
  type SafeResult,
} from '@/lib/errors';
import type { WorkspacePreferences, UpdateResponse, QueryData } from '@/lib/types';

type PreferencesQueryData = QueryData<WorkspacePreferences>;

export function useUpdateToggle(workspaceId: string | null, onError?: () => void) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateResponse>,
    Error,
    boolean,
    { previousPreferences: PreferencesQueryData | undefined }
  >({
    mutationFn: async (enabled: boolean) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.preferences.update({
        params: { workspaceId },
        body: { recordingCustomizeLink: enabled },
      });
      return handleSafeResult(error, response?.data ? { updated: true } : null);
    },
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-preferences', workspaceId] });

      const previousPreferences = queryClient.getQueryData<PreferencesQueryData>([
        'workspace-preferences',
        workspaceId,
      ]);

      queryClient.setQueryData<PreferencesQueryData>(
        ['workspace-preferences', workspaceId],
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              recordingCustomizeLink: enabled,
            },
          };
        }
      );

      return { previousPreferences };
    },
    onSuccess: (result, enabled, context) => {
      if (!result.success) {
        // Rollback on API business error
        if (context?.previousPreferences) {
          queryClient.setQueryData(
            ['workspace-preferences', workspaceId],
            context.previousPreferences
          );
        }
        showErrorToast(result.error);
        onError?.();
        return;
      }
      toast.success('Recording link customization updated');
    },
    onError: (error: unknown, enabled, context) => {
      // Rollback on network error
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          ['workspace-preferences', workspaceId],
          context.previousPreferences
        );
      }
      handleUnknownError(error, 'Failed to update appearance');
      onError?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-preferences', workspaceId] });
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

export function useUpdateAppearance(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateResponse>,
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
        showErrorToast(result.error);
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
      handleUnknownError(error, 'Failed to update appearance');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-preferences', workspaceId] });
    },
  });
}
