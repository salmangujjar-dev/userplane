'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { RecordingPreview } from '@/components/recordings/recording-preview';
import { RecordingGridSkeleton } from '@/components/skeleton';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { ProjectRecordingEmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@workspace/ui/components/tabs';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { Video, Link as LinkIcon, Link2, Globe, Users } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { DinoError } from '@/components/shared/dino-error';
import { tabParser, stringArrayParser } from '@/lib/parsers';
import { useWorkspaceRecordings } from '@/hooks/use-workspace-recordings';
import { useWorkspaceLinks } from '@/hooks/use-workspace-links';
import { useSearchableMembers } from '@/hooks/use-searchable-members';
import { useSearchableLinks } from '@/hooks/use-searchable-links';
import { useWorkspaceDomains } from '@/hooks/use-workspace-domains';
import { useProject } from '@/hooks/use-project';
import { LinksList } from '@/components/links/links-list';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useQueryState('tab', tabParser.withDefault('recordings'));

  // Filter states (URL-synced)
  const [selectedCreators, setSelectedCreators] = useQueryState('creators', stringArrayParser);
  const [selectedRecordingLinks, setSelectedRecordingLinks] = useQueryState(
    'links',
    stringArrayParser
  );
  const [selectedDomains, setSelectedDomains] = useQueryState('domains', stringArrayParser);

  const [recordingsPage, setRecordingsPage] = usePagination('recordingsPage');
  const [linksPage, setLinksPage] = usePagination('linksPage');
  const recordingsPerPage = 16; // 4 columns x 4 rows
  const linksPerPage = 10;

  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');

  // Debounced filter states for API calls
  const [debouncedRecordingFilters, setDebouncedRecordingFilters] = useState<{
    projectId: string[];
    createdBy?: string[];
    linkId?: string[];
  }>({
    projectId: [projectId],
    createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
    linkId: selectedRecordingLinks.length > 0 ? selectedRecordingLinks : undefined,
  });

  const [debouncedLinkFilters, setDebouncedLinkFilters] = useState<{
    projectId: string[];
    createdBy?: string[];
    domainId?: string[];
  }>({
    projectId: [projectId],
    createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
    domainId: selectedDomains.length > 0 ? selectedDomains : undefined,
  });

  // Debounce recording filters
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = {
        projectId: [projectId],
        createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
        linkId: selectedRecordingLinks.length > 0 ? selectedRecordingLinks : undefined,
      };

      // Check if filters actually changed to avoid unnecessary page resets
      const filtersChanged =
        JSON.stringify(newFilters.createdBy) !==
          JSON.stringify(debouncedRecordingFilters.createdBy) ||
        JSON.stringify(newFilters.linkId) !== JSON.stringify(debouncedRecordingFilters.linkId);

      if (filtersChanged) {
        setDebouncedRecordingFilters(newFilters);
        void setRecordingsPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    projectId,
    selectedCreators,
    selectedRecordingLinks,
    debouncedRecordingFilters,
    setRecordingsPage,
  ]);

  // Debounce link filters
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = {
        projectId: [projectId],
        createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
        domainId: selectedDomains.length > 0 ? selectedDomains : undefined,
      };

      // Check if filters actually changed to avoid unnecessary page resets
      const filtersChanged =
        JSON.stringify(newFilters.createdBy) !== JSON.stringify(debouncedLinkFilters.createdBy) ||
        JSON.stringify(newFilters.domainId) !== JSON.stringify(debouncedLinkFilters.domainId);

      if (filtersChanged) {
        setDebouncedLinkFilters(newFilters);
        void setLinksPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [projectId, selectedCreators, selectedDomains, debouncedLinkFilters, setLinksPage]);

  // Fetch project details
  const {
    data: projectResult,
    isLoading: isLoadingProject,
    error: projectError,
  } = useProject(projectId);
  const project = projectResult?.success ? projectResult.data : null;
  const projectTitle = project?.projectTitle || 'Untitled Project';

  // Fetch recordings filtered by project
  const { data: recordingsResult, isLoading: isLoadingRecordings } = useWorkspaceRecordings({
    page: recordingsPage,
    perPage: recordingsPerPage,
    filters: debouncedRecordingFilters,
  });
  const recordingsData = recordingsResult?.success ? recordingsResult.data : null;

  // Fetch links filtered by project
  const { data: linksResult, isLoading: isLoadingLinks } = useWorkspaceLinks({
    page: linksPage,
    perPage: linksPerPage,
    filters: debouncedLinkFilters,
  });
  const linksData = linksResult?.success ? linksResult.data : null;

  // Searchable filters
  const { members, isLoading: isSearchingMembers } = useSearchableMembers(memberSearchQuery, {
    perPage: 5,
  });
  const { links, isLoading: isSearchingLinks } = useSearchableLinks(linkSearchQuery, {
    perPage: 5,
  });
  const { data: domainsResult } = useWorkspaceDomains({
    perPage: 5,
  });
  const domains = domainsResult?.success ? domainsResult.data.domains : null;

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

  const domainOptions =
    domains?.map((domain) => ({
      value: domain.domainId,
      label: domain.domainUrl,
    })) || [];

  const recordingsTotalPages = recordingsData?.pagination.totalPages || 1;
  const linksTotalPages = linksData?.pagination.totalPages || 1;

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
  };

  // Show loading state for project
  if (isLoadingProject) {
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
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <RecordingGridSkeleton count={recordingsPerPage} />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show error state for project
  if (projectError || (projectResult && !projectResult.success) || !project) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <DinoError
            title="Project not found"
            description={
              projectError instanceof Error
                ? projectError.message
                : projectResult && !projectResult.success
                  ? projectResult.error.message
                  : 'This project may have been deleted or you may not have access.'
            }
            onGoBack={() => window.history.back()}
            showRetry={false}
          />
        </div>
      </div>
    );
  }

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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{projectTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  Manage recordings and links for this project
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="recordings" className="gap-2">
                    <Video className="h-4 w-4" />
                    Recordings
                  </TabsTrigger>
                  <TabsTrigger value="links" className="gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Links
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'recordings' && (
                  <div className="flex items-center gap-2">
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
                )}

                {activeTab === 'links' && (
                  <div className="flex items-center gap-2">
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
                      label="Domain"
                      options={domainOptions}
                      selected={selectedDomains}
                      onSelectionChange={setSelectedDomains}
                      placeholder="Search domains..."
                      icon={Globe}
                    />
                  </div>
                )}
              </div>

              <TabsContent value="recordings" className="space-y-6">
                <div className="space-y-6">
                  {isLoadingRecordings ? (
                    <RecordingGridSkeleton count={recordingsPerPage} />
                  ) : recordingsData?.recordings.length === 0 ? (
                    <ProjectRecordingEmptyState
                      onRequestRecording={() => setCreateLinkModalOpen(true)}
                    />
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

                  {!isLoadingRecordings &&
                    recordingsData &&
                    recordingsData.recordings.length > 0 && (
                      <PaginationControls
                        currentPage={recordingsPage}
                        totalPages={recordingsTotalPages}
                        onPageChange={setRecordingsPage}
                      />
                    )}
                </div>
              </TabsContent>

              <TabsContent value="links" className="space-y-6">
                <div className="space-y-6">
                  <LinksList
                    links={linksData?.links}
                    isLoading={isLoadingLinks}
                    onRequestRecording={() => setCreateLinkModalOpen(true)}
                    isProjectContext
                  />

                  {!isLoadingLinks && linksData && linksData.links.length > 0 && (
                    <PaginationControls
                      currentPage={linksPage}
                      totalPages={linksTotalPages}
                      onPageChange={setLinksPage}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <CreateLinkModal
        open={createLinkModalOpen}
        onOpenChange={setCreateLinkModalOpen}
        onLinkCreated={handleLinkCreated}
        hideButton
        defaultProjectId={projectId}
      />

      <ShareLinkModal
        link={shareLink || ''}
        open={!!shareLink}
        onClose={() => setShareLink(null)}
      />
    </div>
  );
}
