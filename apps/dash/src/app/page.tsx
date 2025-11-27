'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateLinkModal } from '@/components/create-link-modal';
import { ShareLinkModal } from '@/components/share-link-modal';
import { InviteModal } from '@/components/invite-modal';
import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardTabs, type TabType } from '@/components/dashboard-tabs';
import { RecordingsTab } from '@/components/recordings-tab';
import { LinksTab } from '@/components/links-tab';
import { SettingsTab } from '@/components/settings-tab';

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
