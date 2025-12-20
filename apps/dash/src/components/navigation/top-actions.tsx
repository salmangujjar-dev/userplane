'use client';

import { WorkspaceMemberAvatars } from '../workspace/workspace-member-avatars';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';

interface TopActionsProps {
  onInviteClick?: () => void;
  createLinkButton?: React.ReactNode;
}

export function TopActions({ onInviteClick, createLinkButton }: TopActionsProps) {
  const { data: members } = useWorkspaceMembers({
    perPage: 3,
    enabled: true,
  });

  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4">
      <WorkspaceMemberAvatars members={members} onInviteClick={onInviteClick} />
      {createLinkButton}
    </div>
  );
}
