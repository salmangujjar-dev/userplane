import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import type { WorkspaceDomain } from '@/hooks/use-workspace-domains';

interface DomainSettings {
  hideSensitiveFields: boolean;
  captureConsoleNetworkLogs: boolean;
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
      if (error) throw error;
      return response.data;
    },
    onMutate: async (url) => {
      await queryClient.cancelQueries({ queryKey: ['domains', workspaceId] });
      const previousDomains = queryClient.getQueryData(['domains', workspaceId]);
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
    onError: (error: Error, variables, context) => {
      if (context?.previousDomains) {
        queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
      }
      toast.error(`Failed to add domain: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Domain added successfully');
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
      if (error) throw error;
      return response.data;
    },
    onMutate: async ({ domainId, url }) => {
      await queryClient.cancelQueries({ queryKey: ['domains', workspaceId] });
      const previousDomains = queryClient.getQueryData(['domains', workspaceId]);
      queryClient.setQueryData(['domains', workspaceId], (old: WorkspaceDomain[] | undefined) => {
        if (!old) return old;
        return old.map((domain) =>
          domain.domainId === domainId ? { ...domain, domainUrl: url } : domain
        );
      });
      return { previousDomains };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousDomains) {
        queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
      }
      toast.error(`Failed to update domain: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Domain updated successfully');
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
      if (error) throw error;
      return response.data;
    },
    onMutate: async (domainId) => {
      await queryClient.cancelQueries({ queryKey: ['domains', workspaceId] });
      const previousDomains = queryClient.getQueryData(['domains', workspaceId]);
      queryClient.setQueryData(['domains', workspaceId], (old: WorkspaceDomain[] | undefined) => {
        if (!old) return old;
        return old.filter((domain) => domain.domainId !== domainId);
      });
      return { previousDomains };
    },
    onError: (error: Error, domainId, context) => {
      if (context?.previousDomains) {
        queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
      }
      toast.error(`Failed to delete domain: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Domain deleted successfully');
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
          recordingCaptureClientLog: settings.captureConsoleNetworkLogs,
          recordingCaptureServerLog: settings.captureBackendServerLogs,
          recordingCaptureNetworkLog: settings.captureConsoleNetworkLogs,
        },
      });
      if (error) throw error;
      return response.data;
    },
    onMutate: async ({ domainId, settings }) => {
      await queryClient.cancelQueries({ queryKey: ['domains', workspaceId] });
      const previousDomains = queryClient.getQueryData(['domains', workspaceId]);

      if (onPreferencesUpdate) {
        onPreferencesUpdate(domainId, settings);
      }

      return { previousDomains };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousDomains) {
        queryClient.setQueryData(['domains', workspaceId], context.previousDomains);
      }
      toast.error(`Failed to update domain settings: ${error.message}`);
    },
    onSuccess: async (_, variables) => {
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
              captureConsoleNetworkLogs:
                preferences.recordingCaptureClientLog || preferences.recordingCaptureNetworkLog,
              captureBackendServerLogs: preferences.recordingCaptureServerLog,
            };
            onPreferencesUpdate(variables.domainId, updatedSettings);
          }
        } catch {
          // Ignore refetch errors
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
    },
  });
}
