'use client';

import { Badge } from '@workspace/ui/components/badge';
import Logo from '@workspace/ui/components/logo';
import { WorkspaceMemberAvatars } from './workspace-member-avatars';

interface WorkspaceMember {
  id: string;
  name: string;
}

interface DashboardNavProps {
  workspaceName: string;
  planName: string;
  inviteButton?: React.ReactNode;
  createLinkButton?: React.ReactNode;
  members?: WorkspaceMember[];
}

export function DashboardNav({
  workspaceName,
  planName,
  inviteButton,
  createLinkButton,
  members,
}: DashboardNavProps) {
  return (
    <nav>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo />
          <Badge variant="secondary" className="rounded-md">
            {planName}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <WorkspaceMemberAvatars members={members} />
          {inviteButton}
          {createLinkButton}
        </div>
      </div>
    </nav>
  );
}
