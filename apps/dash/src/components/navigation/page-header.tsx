'use client';

import { Button } from '@userplane/ui/components/button';
import { SidebarTrigger } from '@userplane/ui/components/sidebar';
import { Plus } from 'lucide-react';
import type React from 'react';

import { useWorkspaceMembers } from '@/features/workspace';

import { WorkspaceMemberAvatars } from '../workspace/workspace-member-avatars';

interface PageHeaderProps {
  title?: string;
  description?: string;
  onInviteClick?: () => void;
  onCreateLinkClick?: () => void;
}

function PageHeaderLeft({ title, description }: Pick<PageHeaderProps, 'title' | 'description'>) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        {title && <h2 className="text-lg font-semibold leading-none">{title}</h2>}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function PageHeaderActions({
  members,
  onInviteClick,
  onCreateLinkClick,
}: Pick<PageHeaderProps, 'onInviteClick' | 'onCreateLinkClick'> & {
  members: React.ComponentProps<typeof WorkspaceMemberAvatars>['members'];
}) {
  return (
    <div className="flex items-center gap-3">
      {onInviteClick && <WorkspaceMemberAvatars members={members} onInviteClick={onInviteClick} />}
      {onCreateLinkClick && (
        <Button variant="default" size="default" onClick={onCreateLinkClick}>
          Create Link
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  onInviteClick,
  onCreateLinkClick,
}: PageHeaderProps) {
  const hasActions = !!(onInviteClick || onCreateLinkClick);

  const { data: membersResult } = useWorkspaceMembers({
    perPage: 3,
    enabled: hasActions,
  });

  const members = membersResult?.success ? membersResult.data.workspaceMembers : undefined;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-6 py-4">
      <PageHeaderLeft title={title} description={description} />
      {hasActions && (
        <PageHeaderActions
          members={members}
          onInviteClick={onInviteClick}
          onCreateLinkClick={onCreateLinkClick}
        />
      )}
    </div>
  );
}
