'use client';

import { WorkspaceMemberAvatars } from '../workspace/workspace-member-avatars';

interface WorkspaceMember {
  id: string;
  name: string;
}

interface TopActionsProps {
  onInviteClick?: () => void;
  createLinkButton?: React.ReactNode;
  members?: WorkspaceMember[];
}

export function TopActions({ onInviteClick, createLinkButton, members }: TopActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4">
      <WorkspaceMemberAvatars members={members} onInviteClick={onInviteClick} />
      {createLinkButton}
    </div>
  );
}
