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
import { LinkPreview } from '@/components/links/link-preview';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { Video, Link as LinkIcon, Link2, Globe } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { tabParser } from '@/lib/parsers';

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

const MOCK_DOMAINS = [
  { value: 'domain-1', label: 'app.example.com' },
  { value: 'domain-2', label: 'dashboard.example.com' },
  { value: 'domain-3', label: 'admin.example.com' },
  { value: 'domain-4', label: 'staging.example.com' },
];

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
  const recordingsTotalPages = 5;
  const linksTotalPages = 3;
  const recordingsPerPage = 16; // 4 columns x 4 rows
  const linksPerPage = 10;

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        workspaceName="Lary's Workspace"
        planName="Starter"
        userName="Bob Smith"
        userEmail="bob.smith@email.com"
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopActions
          onInviteClick={() => setInviteModalOpen(true)}
          createLinkButton={<CreateLinkModal onLinkCreated={handleLinkCreated} />}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Project {projectId}</h2>
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
                      label="Creator"
                      options={MOCK_CREATORS}
                      selected={selectedCreators}
                      onSelectionChange={setSelectedCreators}
                      placeholder="Search creators..."
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
                )}

                {activeTab === 'links' && (
                  <div className="flex items-center gap-2">
                    <FilterDropdown
                      label="Creator"
                      options={MOCK_CREATORS}
                      selected={selectedCreators}
                      onSelectionChange={setSelectedCreators}
                      placeholder="Search creators..."
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
                )}
              </div>

              <TabsContent value="recordings" className="space-y-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(recordingsPerPage)].map((_, i) => {
                      const recordingIndex = (recordingsPage - 1) * recordingsPerPage + i;
                      return (
                        <RecordingPreview
                          key={i}
                          recordingId={`proj-${projectId}-rec-${recordingIndex + 1}`}
                        />
                      );
                    })}
                  </div>

                  <PaginationControls
                    currentPage={recordingsPage}
                    totalPages={recordingsTotalPages}
                    onPageChange={setRecordingsPage}
                  />
                </div>
              </TabsContent>

              <TabsContent value="links" className="space-y-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(linksPerPage)].map((_, i) => {
                      const linkIndex = (linksPage - 1) * linksPerPage + i;
                      const sampleData = [
                        {
                          title: 'Customer Demo Recording',
                          createdBy: 'Sarah Wilson',
                          createdAt: new Date(Date.now() - 1 * 86400000),
                          isReusable: true,
                        },
                        {
                          title: 'Bug Report - Login Issue',
                          createdBy: 'Michael Chen',
                          createdAt: new Date(Date.now() - 3 * 86400000),
                          isReusable: false,
                        },
                        {
                          title: 'Onboarding Flow Testing',
                          createdBy: 'Emma Rodriguez',
                          createdAt: new Date(Date.now() - 5 * 86400000),
                          isReusable: true,
                        },
                        {
                          title: 'Feature Walkthrough - Dashboard',
                          createdBy: 'James Park',
                          createdAt: new Date(Date.now() - 7 * 86400000),
                          isReusable: false,
                        },
                        {
                          title: 'Team Standup Meeting',
                          createdBy: 'Olivia Brown',
                          createdAt: new Date(Date.now() - 14 * 86400000),
                          isReusable: true,
                        },
                      ];
                      const data = sampleData[i % sampleData.length];
                      if (!data) return null;
                      return (
                        <LinkPreview
                          key={i}
                          linkId={`proj-${projectId}-link-${linkIndex + 1}`}
                          title={data.title}
                          createdBy={data.createdBy}
                          createdAt={data.createdAt}
                          projectName={`Project ${projectId}`}
                          isReusable={data.isReusable}
                        />
                      );
                    })}
                  </div>

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
