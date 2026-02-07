'use client';

import { useQueryState } from 'nuqs';

import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { SettingsTab } from '@/components/settings/settings-tab';
import { booleanParser } from '@/lib/parsers';

export default function SettingsPage() {
  const [inviteModalOpen, setInviteModalOpen] = useQueryState('invite', booleanParser);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useQueryState('create_link', booleanParser);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopActions
          onInviteClick={() => setInviteModalOpen(true)}
          onCreateLinkClick={() => setCreateLinkModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Settings</h2>
            <p className="text-sm text-muted-foreground">Manage your workspace settings</p>
          </div>

          <SettingsTab onInviteClick={() => setInviteModalOpen(true)} />
        </main>
      </div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <CreateLinkModal
        open={createLinkModalOpen}
        onOpenChange={setCreateLinkModalOpen}
        hideButton
      />
    </div>
  );
}
