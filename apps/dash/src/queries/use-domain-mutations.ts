import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import {
  handleSafeResult,
  handleUnknownError,
  isErrorCode,
  showErrorToast,
  type SafeResult,
} from '@/lib/errors';
import type {
  DomainRecordingPreferences,
  DomainResponse,
  DomainsData,
  WorkspaceDomain,
  QueryData,
  QuerySnapshot,
} from '@/lib/types';

type DomainsQueryData = QueryData<DomainsData>;

export function useCreateDomain(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<DomainResponse>,
    Error,
    string,
    { previousQueries: QuerySnapshot<DomainsQueryData> }
  >({
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
      const previousQueries: QuerySnapshot<DomainsQueryData> =
        queryClient.getQueriesData<DomainsQueryData>({
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Domain added successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process domain operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
    },
  });
}

export function useUpdateDomain(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<DomainResponse>,
    Error,
    { domainId: string; url: string },
    { previousQueries: QuerySnapshot<DomainsQueryData> }
  >({
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
      const previousQueries: QuerySnapshot<DomainsQueryData> =
        queryClient.getQueriesData<DomainsQueryData>({
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Domain updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process domain operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
    },
  });
}

export function useDeleteDomain(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<{ workspaceId: string; domainId: string }>,
    Error,
    string,
    { previousQueries: QuerySnapshot<DomainsQueryData> }
  >({
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
      const previousQueries: QuerySnapshot<DomainsQueryData> =
        queryClient.getQueriesData<DomainsQueryData>({
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Domain deleted successfully');
    },
    onError: (error: unknown, domainId, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process domain operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
    },
  });
}

export function useUpdateDomainPreferences(
  workspaceId: string | null,
  onPreferencesUpdate?: (domainId: string, settings: DomainRecordingPreferences) => void
) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<{ workspaceId: string; domainId: string }>,
    Error,
    { domainId: string; settings: DomainRecordingPreferences },
    { previousQueries: QuerySnapshot<DomainsQueryData> }
  >({
    mutationFn: async ({
      domainId,
      settings,
    }: {
      domainId: string;
      settings: DomainRecordingPreferences;
    }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.domains.preferences.update({
        params: { workspaceId, domainId },
        body: settings,
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({
      domainId,
      settings,
    }: {
      domainId: string;
      settings: DomainRecordingPreferences;
    }) => {
      await queryClient.cancelQueries({ queryKey: ['domains', workspaceId] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<DomainsQueryData> =
        queryClient.getQueriesData<DomainsQueryData>({
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
        showErrorToast(result.error);
        return;
      }

      toast.success('Domain settings updated successfully');

      if (workspaceId) {
        try {
          const [error, response] = await apiClient.workspace.domains.preferences.get({
            params: { workspaceId, domainId: variables.domainId },
          });

          if (!error && onPreferencesUpdate) {
            onPreferencesUpdate(variables.domainId, response.data);
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
      handleUnknownError(error, 'Failed to process domain operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
    },
  });
}
