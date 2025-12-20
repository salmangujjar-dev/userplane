'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { RecordingPreview } from '@/components/recordings/recording-preview';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@workspace/ui/components/tabs';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { Video, Link as LinkIcon, Link2, Globe, Users } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { tabParser } from '@/lib/parsers';
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
  const [activeTab, setActiveTab] = useQueryState('tab', tabParser.withDefault('recordings'));
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedRecordingLinks, setSelectedRecordingLinks] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [recordingsPage, setRecordingsPage] = usePagination('recordingsPage');
  const [linksPage, setLinksPage] = usePagination('linksPage');
  const recordingsPerPage = 16; // 4 columns x 4 rows
  const linksPerPage = 10;

  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');

  // Fetch project details
  const { data: project } = useProject(projectId);
  const projectTitle = project?.projectTitle || 'Untitled Project';

  // Fetch recordings filtered by project
  const { data: recordingsData, isLoading: isLoadingRecordings } = useWorkspaceRecordings({
    page: recordingsPage,
    perPage: recordingsPerPage,
    filters: {
      projectId: [projectId],
      createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
      linkId: selectedRecordingLinks.length > 0 ? selectedRecordingLinks : undefined,
    },
  });

  // Fetch links filtered by project
  const { data: linksData, isLoading: isLoadingLinks } = useWorkspaceLinks({
    page: linksPage,
    perPage: linksPerPage,
    filters: {
      projectId: [projectId],
      createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
      domainId: selectedDomains.length > 0 ? selectedDomains : undefined,
    },
  });

  // Searchable filters
  const { members, isLoading: isSearchingMembers } = useSearchableMembers(memberSearchQuery, {
    perPage: 5,
  });
  const { links, isLoading: isSearchingLinks } = useSearchableLinks(linkSearchQuery, {
    perPage: 5,
  });
  const { data: domains } = useWorkspaceDomains({
    perPage: 5,
  });

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[...Array(recordingsPerPage)].map((_, i) => (
                        <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : recordingsData?.recordings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">No recordings found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Recordings for this project will appear here
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
                    currentPage={recordingsPage}
                    totalPages={recordingsTotalPages}
                    onPageChange={setRecordingsPage}
                  />
                </div>
              </TabsContent>

              <TabsContent value="links" className="space-y-6">
                <div className="space-y-6">
                  <LinksList links={linksData?.links} isLoading={isLoadingLinks} />

                  <PaginationControls
                    currentPage={linksPage}
                    totalPages={linksTotalPages}
                    onPageChange={setLinksPage}
                  />
                </div>
              </TabsContent>
            </Tabs>
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
