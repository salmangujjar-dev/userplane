'use client';

import { useState } from 'react';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { LinksTab } from '@/components/links/links-tab';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { usePagination } from '@/hooks/use-pagination';
import { FolderKanban, Globe } from 'lucide-react';

const MOCK_PROJECTS = [
  { value: 'project-1', label: 'Website Redesign' },
  { value: 'project-2', label: 'Mobile App' },
  { value: 'project-3', label: 'Marketing Campaign' },
  { value: 'project-4', label: 'Product Launch' },
  { value: 'project-5', label: 'Customer Feedback' },
];

const MOCK_CREATORS = [
  { value: 'creator-1', label: 'Lary Byrd', avatar: true },
  { value: 'creator-2', label: 'Bob Smith', avatar: true },
  { value: 'creator-3', label: 'Alice Johnson', avatar: true },
  { value: 'creator-4', label: 'Charlie Brown', avatar: true },
  { value: 'creator-5', label: 'Diana Prince', avatar: true },
];

const MOCK_DOMAINS = [
  { value: 'domain-1', label: 'app.example.com' },
  { value: 'domain-2', label: 'dashboard.example.com' },
  { value: 'domain-3', label: 'admin.example.com' },
  { value: 'domain-4', label: 'staging.example.com' },
];

export default function LinksPage() {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = usePagination();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const totalPages = 5;

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopActions
          onInviteClick={() => setInviteModalOpen(true)}
          createLinkButton={<CreateLinkModal onLinkCreated={handleLinkCreated} />}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Links</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your recording links</p>
            <div className="flex items-center gap-2 -ml-2.5 mt-3">
              <FilterDropdown
                label="Projects"
                options={MOCK_PROJECTS}
                selected={selectedProjects}
                onSelectionChange={setSelectedProjects}
                placeholder="Search projects..."
                icon={FolderKanban}
              />
              <FilterDropdown
                label="Member"
                options={MOCK_CREATORS}
                selected={selectedCreators}
                onSelectionChange={setSelectedCreators}
                placeholder="Search members..."
                showAvatars
              />
              <FilterDropdown
                label="Domain"
                options={MOCK_DOMAINS}
                selected={selectedDomains}
                onSelectionChange={setSelectedDomains}
                placeholder="Search domains..."
                icon={Globe}
              />
            </div>
          </div>

          <div className="space-y-6">
            <LinksTab />
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
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
