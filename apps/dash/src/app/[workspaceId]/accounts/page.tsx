'use client';

import { useState } from 'react';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { AccountsTab } from '@/components/accounts/accounts-tab';

export default function AccountsPage() {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

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
