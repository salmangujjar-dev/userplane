import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import type { WorkspaceDomain } from '@/hooks/use-workspace-domains';
import { handleApiError, handleSafeResult, isErrorCode } from '@/lib/errors';

interface DomainSettings {
  hideSensitiveFields: boolean;
  captureConsoleLogs: boolean;
  captureClientActions: boolean;
  captureNetworkLogs: boolean;
  captureBackendServerLogs: boolean;
}

export function useCreateDomain(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.domains.add({
        params: { workspaceId },
        body: { url },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (url: string) => {
      await queryClient.cancelQueries({ queryKey: ['domains', workspaceId] });
      const previousDomains = queryClient.getQueryData<WorkspaceDomain[]>(['domains', workspaceId]);
      const optimisticDomain: WorkspaceDomain = {
        domainId: `temp-${Date.now()}`,
        domainUrl: url,
        domainStatus: 'pending',
      };
      queryClient.setQueryData(['domains', workspaceId], (old: WorkspaceDomain[] | undefined) => {
        if (!old) return [optimisticDomain];
        return [...old, optimisticDomain];
      });
      return { previousDomains };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousDomains) {
          queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
        }
        // Handle duplicate domain error
        if (isErrorCode(result.error, 'DOMAIN_ALREADY_EXISTS')) {
          toast.error('Domain already exists', {
            description: 'This domain has already been added to the workspace.',
          });
          return;
        }
        handleApiError(result.error, 'Failed to add domain');
        return;
      }
      toast.success('Domain added successfully');
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousDomains) {
        queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
    },
  });
}

export function useUpdateDomain(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ domainId, url }: { domainId: string; url: string }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.domains.update({
        params: { workspaceId, domainId },
        body: { url },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ domainId, url }: { domainId: string; url: string }) => {
      await queryClient.cancelQueries({ queryKey: ['domains', workspaceId] });
      const previousDomains = queryClient.getQueryData<WorkspaceDomain[]>(['domains', workspaceId]);
      queryClient.setQueryData(['domains', workspaceId], (old: WorkspaceDomain[] | undefined) => {
        if (!old) return old;
        return old.map((domain) =>
          domain.domainId === domainId ? { ...domain, domainUrl: url } : domain
        );
      });
      return { previousDomains };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousDomains) {
          queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
        }
        handleApiError(result.error, 'Failed to update domain');
        return;
      }
      toast.success('Domain updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousDomains) {
        queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
    },
  });
}

export function useDeleteDomain(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domainId: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.domains.delete({
        params: { workspaceId, domainId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (domainId: string) => {
      await queryClient.cancelQueries({ queryKey: ['domains', workspaceId] });
      const previousDomains = queryClient.getQueryData<WorkspaceDomain[]>(['domains', workspaceId]);
      queryClient.setQueryData(['domains', workspaceId], (old: WorkspaceDomain[] | undefined) => {
        if (!old) return old;
        return old.filter((domain) => domain.domainId !== domainId);
      });
      return { previousDomains };
    },
    onSuccess: (result, domainId, context) => {
      if (!result.success) {
        if (context?.previousDomains) {
          queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
        }
        // Handle last domain deletion error
        if (isErrorCode(result.error, 'DOMAIN_LAST_DOMAIN_DELETE_FORBIDDEN')) {
          toast.error("Can't delete the only domain", {
            description: 'Add another domain first.',
          });
          return;
        }
        handleApiError(result.error, 'Failed to delete domain');
        return;
      }
      toast.success('Domain deleted successfully');
    },
    onError: (error: unknown, domainId, context) => {
      if (context?.previousDomains) {
        queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
    },
  });
}

export function useUpdateDomainPreferences(
  workspaceId: string | null,
  onPreferencesUpdate?: (domainId: string, settings: DomainSettings) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ domainId, settings }: { domainId: string; settings: DomainSettings }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.domains.preferences.update({
        params: { workspaceId, domainId },
        body: {
          recordingHideSensitive: settings.hideSensitiveFields,
          recordingCaptureClientLog: settings.captureConsoleLogs,
          recordingCaptureClientAction: settings.captureClientActions,
          recordingCaptureNetworkLog: settings.captureNetworkLogs,
          recordingCaptureServerLog: settings.captureBackendServerLogs,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ domainId, settings }: { domainId: string; settings: DomainSettings }) => {
      await queryClient.cancelQueries({ queryKey: ['domains', workspaceId] });
      const previousDomains = queryClient.getQueryData<WorkspaceDomain[]>(['domains', workspaceId]);

      if (onPreferencesUpdate) {
        onPreferencesUpdate(domainId, settings);
      }

      return { previousDomains };
    },
    onSuccess: async (result, variables, context) => {
      if (!result.success) {
        if (context?.previousDomains) {
          queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
        }
        // Handle unverified domain error
        if (isErrorCode(result.error, 'DOMAIN_UNVERIFIED')) {
          toast.error('Domain not verified', {
            description: 'Please verify the domain first.',
          });
          return;
        }
        handleApiError(result.error, 'Failed to update domain settings');
        return;
      }

      toast.success('Domain settings updated successfully');

      if (workspaceId) {
        try {
          const [error, response] = await apiClient.workspace.domains.preferences.get({
            params: { workspaceId, domainId: variables.domainId },
          });

          if (!error && onPreferencesUpdate) {
            const preferences = response.data;
            const updatedSettings: DomainSettings = {
              hideSensitiveFields: preferences.recordingHideSensitive,
              captureConsoleLogs: preferences.recordingCaptureClientLog,
              captureClientActions: preferences.recordingCaptureClientAction,
              captureNetworkLogs: preferences.recordingCaptureNetworkLog,
              captureBackendServerLogs: preferences.recordingCaptureServerLog,
            };
            onPreferencesUpdate(variables.domainId, updatedSettings);
          }
        } catch {
          // Ignore refetch errors
        }
      }
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousDomains) {
        queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
    },
  });
}
