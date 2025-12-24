'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { RecordingPreview } from '@/components/recordings/recording-preview';
import { RecordingGridSkeleton } from '@/components/skeleton';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { usePagination } from '@/hooks/use-pagination';
import { useWorkspaceRecordings } from '@/hooks/use-workspace-recordings';
import { useSearchableProjects } from '@/hooks/use-searchable-projects';
import { useSearchableMembers } from '@/hooks/use-searchable-members';
import { useSearchableLinks } from '@/hooks/use-searchable-links';
import { FolderKanban, Link2, Users } from 'lucide-react';
import { stringArrayParser } from '@/lib/parsers';
import { DinoError } from '@/components/shared/dino-error';

export default function RecordingsPage() {
  const [currentPage, setCurrentPage] = usePagination();
  const recordingsPerPage = 16; // 4 columns x 4 rows
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useQueryState('projects', stringArrayParser);
  const [selectedCreators, setSelectedCreators] = useQueryState('creators', stringArrayParser);
  const [selectedRecordingLinks, setSelectedRecordingLinks] = useQueryState(
    'links',
    stringArrayParser
  );

  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');

  const {
    data: recordingsResult,
    isLoading: isLoadingRecordings,
    error: recordingsError,
    refetch: refetchRecordings,
  } = useWorkspaceRecordings({
    page: currentPage,
    perPage: recordingsPerPage,
    filters: {
      projectId: selectedProjects.length > 0 ? selectedProjects : undefined,
      createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
      linkId: selectedRecordingLinks.length > 0 ? selectedRecordingLinks : undefined,
    },
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No recordings found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Recordings will appear here when someone submits through your links
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recordingsData?.recordings.map((recording) => (
                  <RecordingPreview
                    key={recording.recordingId}
                    recordingId={recording.recordingId}
                    createdBy={recording.creator.name}
                    createdAt={recording.createdAt}
                    durationMs={recording.recordingDurationMs}
                    thumbnailUrl={recording.recordingThumbnail}
                  />
                ))}
              </div>
            )}

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
