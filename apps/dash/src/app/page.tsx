'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { DashboardNav } from '@/components/navigation/dashboard-nav';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { DashboardTabs } from '@/components/shared/dashboard-tabs';

export default function DashboardPage() {
  const router = useRouter();
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
  };

  const handleSeeMoreRecordings = () => {
    router.push('/recordings');
  };

  return (
    <div className="min-h-svh bg-background">
      <DashboardNav
        workspaceName="Lary's Workspace"
        planName="Starter"
        inviteButton={<InviteModal />}
        createLinkButton={<CreateLinkModal onLinkCreated={handleLinkCreated} />}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <DashboardHeader
          title="Lary's Workspace"
          description="Manage recording links for your workspace"
        />

        <DashboardTabs onSeeMore={handleSeeMoreRecordings} />
      </main>

      <ShareLinkModal
        link={shareLink || ''}
        open={!!shareLink}
        onClose={() => setShareLink(null)}
      />
    </div>
  );
}
