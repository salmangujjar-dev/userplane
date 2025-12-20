'use client';

import { useState } from 'react';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { RecordingPreview } from '@/components/recordings/recording-preview';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { usePagination } from '@/hooks/use-pagination';
import { FolderKanban, Link2 } from 'lucide-react';

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

const MOCK_RECORDING_LINKS = [
  { value: 'link-1', label: 'Demo Recording' },
  { value: 'link-2', label: 'Customer Feedback' },
  { value: 'link-3', label: 'Support Session' },
  { value: 'link-4', label: 'User Onboarding' },
  { value: 'link-5', label: 'Product Testimonial' },
];

export default function RecordingsPage() {
  const [currentPage, setCurrentPage] = usePagination();
  const totalPages = 10;
  const recordingsPerPage = 16; // 4 columns x 4 rows
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedRecordingLinks, setSelectedRecordingLinks] = useState<string[]>([]);

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
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Recordings</h2>
              <p className="text-sm text-muted-foreground mt-1">View received recordings</p>
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
                  label="Link"
                  options={MOCK_RECORDING_LINKS}
                  selected={selectedRecordingLinks}
                  onSelectionChange={setSelectedRecordingLinks}
                  placeholder="Search links..."
                  icon={Link2}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(recordingsPerPage)].map((_, i) => {
                const recordingIndex = (currentPage - 1) * recordingsPerPage + i;
                return (
                  <RecordingPreview
                    key={i}
                    recordingId={`rec-${recordingIndex + 1}`}
                    createdBy="Bob Smith"
                  />
                );
              })}
            </div>

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
