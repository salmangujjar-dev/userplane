'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@workspace/ui/components/tabs';
import { Video, Link as LinkIcon } from 'lucide-react';
import { PaginatedRecordingsTab } from '@/components/recordings/paginated-recordings-tab';
import { PaginatedLinksTab } from '@/components/links/paginated-links-tab';

export type RecordingsTabType = 'recordings' | 'links';

interface RecordingsPageTabsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  recordingsPerPage?: number;
  linksPerPage?: number;
}

export function RecordingsPageTabs({
  currentPage,
  totalPages,
  onPageChange,
  recordingsPerPage = 15,
  linksPerPage = 10,
}: RecordingsPageTabsProps) {
  const tabs: { value: RecordingsTabType; label: string; icon: typeof Video }[] = [
    { value: 'recordings', label: 'Recordings', icon: Video },
    { value: 'links', label: 'Links', icon: LinkIcon },
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
        <PaginatedRecordingsTab
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          recordingsPerPage={recordingsPerPage}
        />
      </TabsContent>
      <TabsContent value="links">
        <PaginatedLinksTab
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          linksPerPage={linksPerPage}
        />
      </TabsContent>
    </Tabs>
  );
}
