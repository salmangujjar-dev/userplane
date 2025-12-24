'use client';

import Link from 'next/link';
import { Badge } from '@workspace/ui/components/badge';
import Logo from '@workspace/ui/components/logo';
import { WorkspaceMemberAvatars } from '../workspace/workspace-member-avatars';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';

interface DashboardNavProps {
  workspaceName: string;
  planName: string;
  inviteButton?: React.ReactNode;
  createLinkButton?: React.ReactNode;
  onInviteClick?: () => void;
}

export function DashboardNav({
  planName,
  inviteButton,
  createLinkButton,
  onInviteClick,
}: DashboardNavProps) {
  const { data: membersResult } = useWorkspaceMembers({
    perPage: 10,
    enabled: true,
  });

  const members = membersResult?.success ? membersResult.data : undefined;

  return (
    <nav>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Logo />
          </Link>
          <Badge variant="secondary" className="rounded-md">
            {planName}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <WorkspaceMemberAvatars members={members} onInviteClick={onInviteClick} />
          {inviteButton}
          {createLinkButton}
        </div>
      </div>
    </nav>
  );
}
