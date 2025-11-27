'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@workspace/ui/components/tabs';
import { Video, Link as LinkIcon, Settings } from 'lucide-react';
import { RecordingsTab } from '@/components/recordings/recordings-tab';
import { LinksTab } from '@/components/links/links-tab';
import { SettingsTab } from '@/components/settings/settings-tab';

export type TabType = 'recordings' | 'links' | 'settings';

interface DashboardTabsProps {
  onSeeMore?: () => void;
}

export function DashboardTabs({ onSeeMore }: DashboardTabsProps) {
  const tabs: { value: TabType; label: string; icon: typeof Video }[] = [
    { value: 'recordings', label: 'Recordings', icon: Video },
    { value: 'links', label: 'Links', icon: LinkIcon },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Tabs defaultValue="recordings" className="w-full">
      <TabsList className="mb-8 bg-transparent p-0 h-auto gap-2">
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="rounded-full data-[state=active]:bg-muted data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-accent gap-2"
          >
            {label}
            <Icon className="h-4 w-4" />
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="recordings">
        <RecordingsTab onSeeMore={onSeeMore} />
      </TabsContent>
      <TabsContent value="links">
        <LinksTab />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsTab />
      </TabsContent>
    </Tabs>
  );
}
