'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { RecordingsTab } from '@/components/recordings/recordings-tab';
import { useWorkspaceStore } from '@/stores/workspace';

export default function DashboardPage() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
  };

  const handleSeeMoreRecordings = () => {
    if (workspaceId) {
      router.push(`/${workspaceId}/recordings`);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        workspaceName="Lary's Workspace"
        planName="Starter"
        userName="Bob Smith"
        userEmail="bob.smith@email.com"
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopActions
          onInviteClick={() => setInviteModalOpen(true)}
          createLinkButton={<CreateLinkModal onLinkCreated={handleLinkCreated} />}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <RecordingsTab onSeeMore={handleSeeMoreRecordings} />
        </main>
      </div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <ShareLinkModal
        link={shareLink || ''}
        open={!!shareLink}
        onClose={() => setShareLink(null)}
      />
    </div>
  );
}
