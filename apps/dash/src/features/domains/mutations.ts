import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showApiErrorToast,
} from '@/lib/errors';
import {
  showCreatedToast,
  showDeletedToast,
  showInvitesSentToast,
  showSettingsSavedToast,
  showUpdatedToast,
} from '@/lib/toasts';
import { useWorkspaceId } from '@/stores/workspace';
import type {
  DomainRecordingPreferences,
  DomainResponse,
  DomainsData,
  QueryData,
  QuerySnapshot,
  WorkspaceDomain,
} from '@/types';

import { workspaceKeys } from '../workspace/query-keys';
import { domainKeys } from './query-keys';

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
      await queryClient.cancelQueries({ queryKey: domainKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<DomainsQueryData> =
        queryClient.getQueriesData<DomainsQueryData>({
          queryKey: domainKeys.lists(),
        });

      const optimisticDomain: WorkspaceDomain = {
        domainId: `temp-${Date.now()}`,
        domainUrl: url,
        domainStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update ALL matching queries
      queryClient.setQueriesData<DomainsQueryData>({ queryKey: domainKeys.lists() }, (old) => {
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
      });

      return { previousQueries };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showApiErrorToast(result.error);
        return;
      }
      showCreatedToast('Domain', 'Domain is pending verification');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to create domain');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
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
      await queryClient.cancelQueries({ queryKey: domainKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<DomainsQueryData> =
        queryClient.getQueriesData<DomainsQueryData>({
          queryKey: domainKeys.lists(),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<DomainsQueryData>({ queryKey: domainKeys.lists() }, (old) => {
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
      });

      return { previousQueries };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showApiErrorToast(result.error);
        return;
      }
      showUpdatedToast('Domain');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to update domain');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
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
      await queryClient.cancelQueries({ queryKey: domainKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<DomainsQueryData> =
        queryClient.getQueriesData<DomainsQueryData>({
          queryKey: domainKeys.lists(),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<DomainsQueryData>({ queryKey: domainKeys.lists() }, (old) => {
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
      });

      return { previousQueries };
    },
    onSuccess: (result, domainId, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showApiErrorToast(result.error);
        return;
      }
      showDeletedToast('Domain', 'Domain has been permanently removed');
    },
    onError: (error: unknown, domainId, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to delete domain');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
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
      await queryClient.cancelQueries({ queryKey: domainKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<DomainsQueryData> =
        queryClient.getQueriesData<DomainsQueryData>({
          queryKey: domainKeys.lists(),
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
        showApiErrorToast(result.error);
        return;
      }

      showSettingsSavedToast('domain-settings', 'Domain settings updated successfully');

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
      handleUnknownError(error, 'Failed to update domain preferences');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: domainKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
    },
  });
}

// ============================================
// DOMAIN INSTRUCTIONS
// ============================================

interface SendInstructionsData {
  sentCount: number;
}

interface SendDomainInstructionsParams {
  domainId: string;
  emails: string[];
}

/**
 * Hook to send domain setup instructions to developers
 */
export function useSendDomainInstructions() {
  const workspaceId = useWorkspaceId();

  return useMutation<SafeResult<SendInstructionsData>, Error, SendDomainInstructionsParams>({
    mutationFn: async ({ domainId, emails }: SendDomainInstructionsParams) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.domains.sendInstructions({
        params: { workspaceId, domainId },
        body: { emails },
      });
      return handleSafeResult(error, response?.data ? { sentCount: emails.length } : null);
    },
    onSuccess: (result, { emails }) => {
      if (!result.success) {
        showApiErrorToast(result.error);
        return;
      }
      showInvitesSentToast(emails.length);
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to send developer instructions');
    },
  });
}
