'use client';

import { useState } from 'react';
import { LinkPreview } from './link-preview';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { LinksListSkeleton } from '@/components/skeleton';
import { useWorkspaceId } from '@/stores/workspace';
import { useUpdateLink, useDeleteLink } from '@/queries/use-link-mutations';
import type { Link } from '@/hooks/use-workspace-links';

interface LinksListProps {
  links?: Link[];
  isLoading?: boolean;
}

export function LinksList({ links, isLoading }: LinksListProps) {
  const workspaceId = useWorkspaceId();
  const [deletingLink, setDeletingLink] = useState<{
    linkId: string;
    linkTitle: string | null;
  } | null>(null);

  const updateLinkMutation = useUpdateLink(workspaceId);
  const deleteLinkMutation = useDeleteLink(workspaceId);

  const handleEditLink = (linkId: string, title: string, reference: string, reusable: boolean) => {
    updateLinkMutation.mutate({ linkId, title, reference, reusable });
  };

  const handleDeleteLink = (linkId: string, linkTitle: string | null) => {
    setDeletingLink({ linkId, linkTitle });
  };

  const handleConfirmDelete = () => {
    if (deletingLink) {
      deleteLinkMutation.mutate(deletingLink.linkId, {
        onSuccess: () => {
          setDeletingLink(null);
        },
      });
    }
  };

  if (isLoading) {
    return <LinksListSkeleton count={10} />;
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
