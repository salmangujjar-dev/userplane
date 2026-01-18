'use client';

import { useWorkspaceMembers } from '@/hooks/use-workspace-members';

import { WorkspaceMemberAvatars } from '../workspace/workspace-member-avatars';

interface TopActionsProps {
  onInviteClick?: () => void;
  createLinkButton?: React.ReactNode;
}

export function TopActions({ onInviteClick, createLinkButton }: TopActionsProps) {
  const { data: membersResult } = useWorkspaceMembers({
    perPage: 3,
    enabled: true,
  });

  const members = membersResult?.success ? membersResult.data.workspaceMembers : undefined;

  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4">
      <WorkspaceMemberAvatars members={members} onInviteClick={onInviteClick} />
      {createLinkButton}
    </div>
  );
}
