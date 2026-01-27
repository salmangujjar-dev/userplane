'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';

import { useWorkspaceMembers } from '@/hooks/use-workspace-members';

import { WorkspaceMemberAvatars } from '../workspace/workspace-member-avatars';

interface TopActionsProps {
  onInviteClick?: () => void;
  onCreateLinkClick?: () => void;
}

export function TopActions({ onInviteClick, onCreateLinkClick }: TopActionsProps) {
  const { data: membersResult } = useWorkspaceMembers({
    perPage: 3,
    enabled: true,
  });

  const members = membersResult?.success ? membersResult.data.workspaceMembers : undefined;

  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4">
      <WorkspaceMemberAvatars members={members} onInviteClick={onInviteClick} />
      {onCreateLinkClick && (
        <Button
          variant="default"
          size="default"
          className="rounded-full"
          onClick={onCreateLinkClick}
        >
          Create Link
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
