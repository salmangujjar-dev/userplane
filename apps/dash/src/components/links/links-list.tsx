'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinkPreview } from './link-preview';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import { useWorkspaceId } from '@/stores/workspace';
import type { Link } from '@/hooks/use-workspace-links';

interface LinksListProps {
  links?: Link[];
  isLoading?: boolean;
}

export function LinksList({ links, isLoading }: LinksListProps) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [deletingLink, setDeletingLink] = useState<{
    linkId: string;
    linkTitle: string | null;
  } | null>(null);

  const updateLinkMutation = useMutation({
    mutationFn: async ({
      linkId,
      title,
      reference,
      reusable,
    }: {
      linkId: string;
      title: string;
      reference: string;
      reusable: boolean;
    }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      return await apiClient.link.update({
        params: { workspaceId, linkId },
        body: {
          linkTitle: title || null,
          linkProviderRef: reference || null,
          linkReusable: reusable,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
      toast.success('Link updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update link: ${error.message}`);
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      return await apiClient.link.delete({
        params: { workspaceId, linkId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
      toast.success('Link deleted successfully');
      setDeletingLink(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete link: ${error.message}`);
    },
  });

  const handleEditLink = (linkId: string, title: string, reference: string, reusable: boolean) => {
    updateLinkMutation.mutate({ linkId, title, reference, reusable });
  };

  const handleDeleteLink = (linkId: string, linkTitle: string | null) => {
    setDeletingLink({ linkId, linkTitle });
  };

  const handleConfirmDelete = () => {
    if (deletingLink) {
      deleteLinkMutation.mutate(deletingLink.linkId);
    }
  };
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!links || links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No links found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a link to start collecting recordings
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {links.map((link) => (
          <LinkPreview
            key={link.linkId}
            linkId={link.linkId}
            linkURL={link.linkURL}
            title={link.linkTitle}
            createdBy={link.creator.name}
            createdAt={link.createdAt}
            projectName={link.project.title}
            isReusable={link.linkReusable}
            domainUrl={link.domain.url}
            onEdit={(title, reference, reusable) =>
              handleEditLink(link.linkId, title, reference, reusable)
            }
            onDelete={() => handleDeleteLink(link.linkId, link.linkTitle)}
          />
        ))}
      </div>

      <DeleteConfirmationModal
        open={!!deletingLink}
        onOpenChange={(open) => !open && setDeletingLink(null)}
        itemName={deletingLink?.linkTitle || 'Untitled Link'}
        itemType="link"
        onConfirm={handleConfirmDelete}
        isLoading={deleteLinkMutation.isPending}
      />
    </>
  );
}
