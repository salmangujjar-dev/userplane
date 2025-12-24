import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import type { Link } from '@/hooks/use-workspace-links';
import type { WorkspaceDomain } from '@/hooks/use-workspace-domains';
import { handleApiError, handleSafeResult } from '@/lib/errors';

interface CreateLinkInput {
  domainId: string;
  projectId?: string;
  linkReference?: string;
  linkReusable: boolean;
}

export function useCreateLink(workspaceId: string | null, domains?: WorkspaceDomain[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLinkInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.create({
        params: { workspaceId },
        body: data,
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (data: CreateLinkInput) => {
      await queryClient.cancelQueries({ queryKey: ['links', workspaceId] });

      const previousLinks = queryClient.getQueryData<{ links: Link[] }>(['links', workspaceId]);

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

      queryClient.setQueryData(['links', workspaceId], (old: { links: Link[] } | undefined) => {
        if (!old) return { links: [optimisticLink as Link] };
        return {
          ...old,
          links: [optimisticLink as Link, ...old.links],
        };
      });

      return { previousLinks };
    },
    onSuccess: (result, data, context) => {
      if (!result.success) {
        if (context?.previousLinks) {
          queryClient.setQueryData(['links', workspaceId], context.previousLinks);
        }
        handleApiError(result.error, 'Failed to create link');
        return;
      }
      toast.success('Link created successfully');
    },
    onError: (error: unknown, data, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(['links', workspaceId], context.previousLinks);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
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

      const previousLinks = queryClient.getQueryData<{ links: Link[] }>(['links', workspaceId]);

      queryClient.setQueryData(['links', workspaceId], (old: { links: Link[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.map((link) =>
            link.linkId === linkId
              ? {
                  ...link,
                  linkTitle: title || null,
                  linkReusable: reusable,
                }
              : link
          ),
        };
      });

      return { previousLinks };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousLinks) {
          queryClient.setQueryData(['links', workspaceId], context.previousLinks);
        }
        handleApiError(result.error, 'Failed to update link');
        return;
      }
      toast.success('Link updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(['links', workspaceId], context.previousLinks);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
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

      const previousLinks = queryClient.getQueryData<{ links: Link[] }>(['links', workspaceId]);

      queryClient.setQueryData(['links', workspaceId], (old: { links: Link[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.filter((link) => link.linkId !== linkId),
        };
      });

      return { previousLinks };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousLinks) {
          queryClient.setQueryData(['links', workspaceId], context.previousLinks);
        }
        handleApiError(result.error, 'Failed to delete link');
        return;
      }
      toast.success('Link deleted successfully');
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(['links', workspaceId], context.previousLinks);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
    },
  });
}
