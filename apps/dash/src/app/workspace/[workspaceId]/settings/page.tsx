'use client';

import { useQueryState } from 'nuqs';

import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { PageHeader } from '@/components/navigation/page-header';
import { SettingsTab } from '@/components/settings/settings-tab';
import { booleanParser } from '@/lib/parsers';

export default function SettingsPage() {
  const [inviteModalOpen, setInviteModalOpen] = useQueryState('invite', booleanParser);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useQueryState('create_link', booleanParser);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your workspace settings"
        onInviteClick={() => setInviteModalOpen(true)}
        onCreateLinkClick={() => setCreateLinkModalOpen(true)}
      />

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <SettingsTab onInviteClick={() => setInviteModalOpen(true)} />
      </main>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <CreateLinkModal
        open={createLinkModalOpen}
        onOpenChange={setCreateLinkModalOpen}
        hideButton
      />
    </>
  );
}
