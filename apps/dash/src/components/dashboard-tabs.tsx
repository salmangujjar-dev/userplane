'use client';

import { Button } from '@workspace/ui/components/button';
import { Video, Link as LinkIcon, Settings } from 'lucide-react';

export type TabType = 'recordings' | 'links' | 'settings';

interface DashboardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  const tabs: { value: TabType; label: string; icon: typeof Video }[] = [
    { value: 'recordings', label: 'Recordings', icon: Video },
    { value: 'links', label: 'Links', icon: LinkIcon },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex gap-2 mb-8">
      {tabs.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={activeTab === value ? 'secondary' : 'ghost'}
          size="default"
          className={`rounded-full gap-2 ${
            activeTab === value ? 'bg-muted hover:bg-muted/80' : ''
          }`}
          onClick={() => onTabChange(value)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
