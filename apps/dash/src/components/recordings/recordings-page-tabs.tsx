'use client';

import { Button } from '@workspace/ui/components/button';
import { Video, Link as LinkIcon } from 'lucide-react';

export type RecordingsTabType = 'recordings' | 'links';

interface RecordingsPageTabsProps {
  activeTab: RecordingsTabType;
  onTabChange: (tab: RecordingsTabType) => void;
}

export function RecordingsPageTabs({ activeTab, onTabChange }: RecordingsPageTabsProps) {
  const tabs: { value: RecordingsTabType; label: string; icon: typeof Video }[] = [
    { value: 'recordings', label: 'Recordings', icon: Video },
    { value: 'links', label: 'Links', icon: LinkIcon },
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
