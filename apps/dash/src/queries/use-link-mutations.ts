import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LinkErrors } from '@workspace/contract';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import type { Link, LinksData } from '@/hooks/use-workspace-links';
import { handleSafeResult, handleUnknownError, showErrorToast } from '@/lib/errors';
import type { QueryData, QuerySnapshot, WorkspaceDomain } from '@/types';

interface CreateLinkInput {
  domainId: string;
  projectId?: string;
  linkReference?: string;
  linkReusable: boolean;
}

type LinksQueryData = QueryData<LinksData>;

interface CreateLinkOptions {
  data: CreateLinkInput;
  throwErrors?: Array<keyof typeof LinkErrors>;
}

export function useCreateLink(workspaceId: string | null, domains?: WorkspaceDomain[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data }: CreateLinkOptions) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.create({
        params: { workspaceId },
        body: data,
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ data }: CreateLinkOptions) => {
      await queryClient.cancelQueries({ queryKey: ['links', workspaceId] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<LinksQueryData> =
        queryClient.getQueriesData<LinksQueryData>({
          queryKey: ['links', workspaceId],
        });

      // Find domain for optimistic data
      const domain = domains?.find((d) => d.domainId === data.domainId);

      // Optimistically add new link
      const optimisticLink: Partial<Link> = {
        linkId: `temp-${Date.now()}`,
        linkURL: `${domain?.domainUrl || ''}/temp-link`,
        linkTitle: data.linkReference || null,
        linkReusable: data.linkReusable,
        createdAt: new Date().toISOString(),
      };

      // Update ALL matching queries
      queryClient.setQueriesData<LinksQueryData>({ queryKey: ['links', workspaceId] }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            links: [optimisticLink as Link, ...old.data.links],
            pagination: {
              ...old.data.pagination,
              total: old.data.pagination.total + 1,
            },
          },
        };
      });

      return { previousQueries };
    },
    onSuccess: (result, { throwErrors }, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });

        // If error code is in throwErrors list, throw it so caller can catch in onError
        const shouldThrow = throwErrors?.includes(result.error.code as keyof typeof LinkErrors);
        if (shouldThrow) {
          throw result.error;
        }

        // Otherwise show default toast
        showErrorToast(result.error);
        return;
      }
      toast.success('Link created successfully');
    },
    onError: (error: unknown, { throwErrors }, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      // Check if this is an error we intentionally threw (should be handled by caller)
      const err = error as { code?: string };
      const isIntentionalThrow =
        err.code && throwErrors?.includes(err.code as keyof typeof LinkErrors);

      // Only show toast for unexpected errors, not intentionally thrown ones
      if (!isIntentionalThrow) {
        handleUnknownError(error, 'Failed to process link operation');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
    },
  });
}

interface UpdateLinkInput {
  linkId: string;
  title: string;
  reference: string;
  reusable: boolean;
}

export function useUpdateLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, title, reference, reusable }: UpdateLinkInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.update({
        params: { workspaceId, linkId },
        body: {
          linkTitle: title || null,
          linkProviderRef: reference || null,
          linkReusable: reusable,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ linkId, title, reusable }) => {
      await queryClient.cancelQueries({ queryKey: ['links', workspaceId] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<LinksQueryData> =
        queryClient.getQueriesData<LinksQueryData>({
          queryKey: ['links', workspaceId],
        });

      // Update ALL matching queries
      queryClient.setQueriesData<LinksQueryData>({ queryKey: ['links', workspaceId] }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            links: old.data.links.map((link) =>
              link.linkId === linkId
                ? {
                    ...link,
                    linkTitle: title || null,
                    linkReusable: reusable,
                  }
                : link
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Link updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process link operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
    },
  });
}

export function useDeleteLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.delete({
        params: { workspaceId, linkId },
      });
      return handleSafeResult(error, response?.data ? { deleted: true } : null);
    },
    onMutate: async (linkId) => {
      await queryClient.cancelQueries({ queryKey: ['links', workspaceId] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<LinksQueryData> =
        queryClient.getQueriesData<LinksQueryData>({
          queryKey: ['links', workspaceId],
        });

      // Update ALL matching queries
      queryClient.setQueriesData<LinksQueryData>({ queryKey: ['links', workspaceId] }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            links: old.data.links.filter((link) => link.linkId !== linkId),
            pagination: {
              ...old.data.pagination,
              total: Math.max(0, old.data.pagination.total - 1),
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Link deleted successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process link operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
    },
  });
}
