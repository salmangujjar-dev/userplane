'use client';

import { useState } from 'react';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { AccountsTab } from '@/components/accounts/accounts-tab';

export default function AccountsPage() {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        workspaceName="Lary's Workspace"
        planName="Starter"
        userName="Olivia Martin"
        userEmail="olivia.martin@email.com"
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-[72px]" />
        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Accounts</h2>
            <p className="text-sm text-muted-foreground">Manage your accounts settings</p>
          </div>

          <AccountsTab />
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
