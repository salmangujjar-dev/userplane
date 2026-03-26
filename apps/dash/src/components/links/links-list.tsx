'use client';

import { useState } from 'react';

import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { LinkEmptyState, ProjectLinkEmptyState } from '@/components/shared/empty-state';
import { LinksListSkeleton } from '@/components/skeleton';
import type { Link } from '@/features/links';
import { useDeleteLink, useUpdateLink } from '@/features/links';
import { useWorkspaceRole } from '@/features/workspace';
import { useWorkspaceId } from '@/stores/workspace';

import { LinkPreview } from './link-preview';

interface LinksListProps {
  links?: Link[];
  isLoading?: boolean;
  onRequestRecording?: () => void;
  isProjectContext?: boolean;
}

export function LinksList({
  links,
  isLoading,
  onRequestRecording,
  isProjectContext,
}: LinksListProps) {
  const workspaceId = useWorkspaceId();
  const [deletingLink, setDeletingLink] = useState<{
    linkId: string;
    linkTitle: string | null;
  } | null>(null);

  const updateLinkMutation = useUpdateLink(workspaceId);
  const deleteLinkMutation = useDeleteLink(workspaceId);

  // Get current user's workspace role and member ID
  const { data: roleResult } = useWorkspaceRole();
  const membership = roleResult?.success ? roleResult.data : null;
  const isAdminOrOwner =
    membership?.workspaceRole === 'admin' || membership?.workspaceRole === 'owner';

  // Helper to check if user can delete a specific link
  const canDeleteLink = (creatorId: string) => {
    return isAdminOrOwner || membership?.workspaceMemberId === creatorId;
  };

  const handleEditLink = (
    linkId: string,
    title: string,
    reference: string,
    reusable: boolean,
    meta?: Record<string, string>
  ) => {
    updateLinkMutation.mutate({ linkId, title, reference, reusable, meta });
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
    const EmptyState = isProjectContext ? ProjectLinkEmptyState : LinkEmptyState;
    return <EmptyState onCreateLink={onRequestRecording ?? (() => {})} />;
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
            reference={link.linkProviderReference}
            linkProvider={link.linkProviderType}
            linkProviderId={link.linkProviderId}
            meta={link.meta}
            createdBy={link.creator.name}
            createdAt={link.createdAt}
            projectName={link.project.title}
            isReusable={link.linkReusable}
            domainUrl={link.domain.url}
            canDelete={canDeleteLink(link.creator.workspaceMemberId)}
            onEdit={(title, reference, reusable, meta) =>
              handleEditLink(link.linkId, title, reference, reusable, meta)
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
