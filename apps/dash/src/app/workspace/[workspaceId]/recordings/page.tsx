'use client';

import { FolderKanban, Link2, Users } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { PageHeader } from '@/components/navigation/page-header';
import { RecordingPreview } from '@/components/recordings/recording-preview';
import { DinoError } from '@/components/shared/dino-error';
import { RecordingEmptyState } from '@/components/shared/empty-state';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { RecordingGridSkeleton } from '@/components/skeleton';
import { useWorkspaceRecordings } from '@/features/recordings';
import { usePagination } from '@/hooks/use-pagination';
import { useSearchableLinks } from '@/hooks/use-searchable-links';
import { useSearchableMembers } from '@/hooks/use-searchable-members';
import { useSearchableProjects } from '@/hooks/use-searchable-projects';
import { booleanParser, stringArrayParser } from '@/lib/parsers';

export default function RecordingsPage() {
  const [currentPage, setCurrentPage] = usePagination();
  const recordingsPerPage = 16; // 4 columns x 4 rows
  const [inviteModalOpen, setInviteModalOpen] = useQueryState('invite', booleanParser);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useQueryState('create_link', booleanParser);

  // Filter states (URL-synced)
  const [selectedProjects, setSelectedProjects] = useQueryState('projects', stringArrayParser);
  const [selectedCreators, setSelectedCreators] = useQueryState('creators', stringArrayParser);
  const [selectedRecordingLinks, setSelectedRecordingLinks] = useQueryState(
    'links',
    stringArrayParser
  );

  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');

  // Debounced filter states for API calls
  const [debouncedFilters, setDebouncedFilters] = useState<{
    projectId?: string[];
    createdBy?: string[];
    linkId?: string[];
  }>({
    projectId: selectedProjects.length > 0 ? selectedProjects : undefined,
    createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
    linkId: selectedRecordingLinks.length > 0 ? selectedRecordingLinks : undefined,
  });

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = {
        projectId: selectedProjects.length > 0 ? selectedProjects : undefined,
        createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
        linkId: selectedRecordingLinks.length > 0 ? selectedRecordingLinks : undefined,
      };

      // Check if filters actually changed to avoid unnecessary page resets
      const filtersChanged =
        JSON.stringify(newFilters.projectId) !== JSON.stringify(debouncedFilters.projectId) ||
        JSON.stringify(newFilters.createdBy) !== JSON.stringify(debouncedFilters.createdBy) ||
        JSON.stringify(newFilters.linkId) !== JSON.stringify(debouncedFilters.linkId);

      if (filtersChanged) {
        setDebouncedFilters(newFilters);
        void setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    selectedProjects,
    selectedCreators,
    selectedRecordingLinks,
    debouncedFilters,
    setCurrentPage,
  ]);

  const {
    data: recordingsResult,
    isLoading: isLoadingRecordings,
    error: recordingsError,
    refetch: refetchRecordings,
  } = useWorkspaceRecordings({
    page: currentPage,
    perPage: recordingsPerPage,
    filters: debouncedFilters,
  });

  const recordingsData = recordingsResult?.success ? recordingsResult.data : null;

  const { projects, isLoading: isSearchingProjects } = useSearchableProjects(projectSearchQuery, {
    perPage: 5,
  });
  const { members, isLoading: isSearchingMembers } = useSearchableMembers(memberSearchQuery, {
    perPage: 5,
  });
  const { links, isLoading: isSearchingLinks } = useSearchableLinks(linkSearchQuery, {
    perPage: 5,
  });

  const projectOptions =
    projects?.map((project) => ({
      value: project.projectId,
      label: project.projectTitle || 'Untitled Project',
    })) || [];

  const memberOptions =
    members?.map((member) => ({
      value: member.workspaceMemberId,
      label: member.memberName,
      avatar: true,
    })) || [];

  const linkOptions =
    links?.map((link) => ({
      value: link.linkId,
      label: link.linkTitle || 'Untitled Link',
    })) || [];

  const totalPages = recordingsData?.pagination.totalPages || 1;

  return (
    <>
      <PageHeader
        title="Recordings"
        description="View received recordings"
        onInviteClick={() => setInviteModalOpen(true)}
        onCreateLinkClick={() => setCreateLinkModalOpen(true)}
      />

      <main className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="space-y-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 -ml-2.5">
              <FilterDropdown
                label="Projects"
                options={projectOptions}
                selected={selectedProjects}
                onSelectionChange={setSelectedProjects}
                onSearchChange={setProjectSearchQuery}
                isSearching={isSearchingProjects}
                placeholder="Search projects..."
                icon={FolderKanban}
              />
              <FilterDropdown
                label="Member"
                options={memberOptions}
                selected={selectedCreators}
                onSelectionChange={setSelectedCreators}
                onSearchChange={setMemberSearchQuery}
                isSearching={isSearchingMembers}
                placeholder="Search members..."
                icon={Users}
                showAvatars
              />
              <FilterDropdown
                label="Link"
                options={linkOptions}
                selected={selectedRecordingLinks}
                onSelectionChange={setSelectedRecordingLinks}
                onSearchChange={setLinkSearchQuery}
                isSearching={isSearchingLinks}
                placeholder="Search links..."
                icon={Link2}
              />
            </div>
          </div>

          {recordingsError || (recordingsResult && !recordingsResult.success) ? (
            <div className="flex items-center justify-center py-12">
              <DinoError
                title="Failed to load recordings"
                description={
                  recordingsError instanceof Error
                    ? recordingsError.message
                    : recordingsResult && !recordingsResult.success
                      ? recordingsResult.error.message
                      : 'Something went wrong while loading recordings.'
                }
                onRetry={() => refetchRecordings()}
                showGoBack={false}
              />
            </div>
          ) : isLoadingRecordings ? (
            <RecordingGridSkeleton count={recordingsPerPage} />
          ) : recordingsData?.recordings.length === 0 ? (
            <RecordingEmptyState onRequestRecording={() => setCreateLinkModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recordingsData?.recordings.map((recording) => (
                <RecordingPreview
                  key={recording.recordingId}
                  recordingId={recording.recordingId}
                  createdBy={recording.creator.name}
                  createdAt={recording.createdAt}
                  expiresAt={recording.expiresAt}
                  durationMs={recording.recordingDurationMs}
                  thumbnailUrl={recording.recordingThumbnail}
                />
              ))}
            </div>
          )}

          {!isLoadingRecordings && recordingsData && recordingsData.recordings.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
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
