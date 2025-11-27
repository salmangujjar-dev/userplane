'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { DashboardNav } from '@/components/navigation/dashboard-nav';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { DashboardTabs, type TabType } from '@/components/shared/dashboard-tabs';
import { RecordingsTab } from '@/components/recordings/recordings-tab';
import { LinksTab } from '@/components/links/links-tab';
import { SettingsTab } from '@/components/settings/settings-tab';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('recordings');
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

        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'recordings' && <RecordingsTab onSeeMore={handleSeeMoreRecordings} />}

        {activeTab === 'links' && <LinksTab />}

        {activeTab === 'settings' && <SettingsTab />}
      </main>

      <ShareLinkModal
        link={shareLink || ''}
        open={!!shareLink}
        onClose={() => setShareLink(null)}
      />
    </div>
  );
}
