import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import type { WorkspaceDomain } from '@/hooks/use-workspace-domains';
import { handleApiError, handleSafeResult, isErrorCode, type SafeResult } from '@/lib/errors';
import { type DomainSettings, transformApiPreferencesToSettings } from '@/lib/types/domain';

interface DomainsData {
  domains: WorkspaceDomain[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

type DomainsQueryData = SafeResult<DomainsData>;
type QuerySnapshot = [queryKey: readonly unknown[], data: DomainsQueryData | undefined][];

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

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<DomainsQueryData>({
        queryKey: ['domains', workspaceId],
      });

      const optimisticDomain: WorkspaceDomain = {
        domainId: `temp-${Date.now()}`,
        domainUrl: url,
        domainStatus: 'pending',
      };

      // Update ALL matching queries
      queryClient.setQueriesData<DomainsQueryData>(
        { queryKey: ['domains', workspaceId] },
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              domains: [...old.data.domains, optimisticDomain],
              pagination: {
                ...old.data.pagination,
                total: old.data.pagination.total + 1,
              },
            },
          };
        }
      );

      return { previousQueries };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
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
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
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

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<DomainsQueryData>({
        queryKey: ['domains', workspaceId],
      });

      // Update ALL matching queries
      queryClient.setQueriesData<DomainsQueryData>(
        { queryKey: ['domains', workspaceId] },
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              domains: old.data.domains.map((domain) =>
                domain.domainId === domainId ? { ...domain, domainUrl: url } : domain
              ),
            },
          };
        }
      );

      return { previousQueries };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        handleApiError(result.error, 'Failed to update domain');
        return;
      }
      toast.success('Domain updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
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

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<DomainsQueryData>({
        queryKey: ['domains', workspaceId],
      });

      // Update ALL matching queries
      queryClient.setQueriesData<DomainsQueryData>(
        { queryKey: ['domains', workspaceId] },
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              domains: old.data.domains.filter((domain) => domain.domainId !== domainId),
              pagination: {
                ...old.data.pagination,
                total: Math.max(0, old.data.pagination.total - 1),
              },
            },
          };
        }
      );

      return { previousQueries };
    },
    onSuccess: (result, domainId, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
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
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
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

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<DomainsQueryData>({
        queryKey: ['domains', workspaceId],
      });

      if (onPreferencesUpdate) {
        onPreferencesUpdate(domainId, settings);
      }

      return { previousQueries };
    },
    onSuccess: async (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
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
            const updatedSettings = transformApiPreferencesToSettings(response.data);
            onPreferencesUpdate(variables.domainId, updatedSettings);
          }
        } catch {
          // Ignore refetch errors
        }
      }
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
    },
  });
}
