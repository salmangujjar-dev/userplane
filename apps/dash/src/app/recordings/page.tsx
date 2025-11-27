'use client';

import { useState } from 'react';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { DashboardNav } from '@/components/navigation/dashboard-nav';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { RecordingsPageTabs } from '@/components/recordings/recordings-page-tabs';

export default function RecordingsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
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
        <DashboardHeader title="Recents" description="Recordings from your links" />

        <RecordingsPageTabs
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          recordingsPerPage={15}
          linksPerPage={10}
        />
      </main>

      <ShareLinkModal
        link={shareLink || ''}
        open={!!shareLink}
        onClose={() => setShareLink(null)}
      />
    </div>
  );
}
