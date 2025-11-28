'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { RecordingPreview } from '@/components/recordings/recording-preview';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@workspace/ui/components/tabs';
import { LinkPreview } from '@/components/links/link-preview';
import { Video, Link as LinkIcon } from 'lucide-react';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [recordingsPage, setRecordingsPage] = useState(1);
  const [linksPage, setLinksPage] = useState(1);
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
        userName="Olivia Martin"
        userEmail="olivia.martin@email.com"
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

            <Tabs defaultValue="recordings" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="recordings" className="gap-2">
                  <Video className="h-4 w-4" />
                  Recordings
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Shared Links
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recordings" className="space-y-6">
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
              </TabsContent>

              <TabsContent value="links" className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {[...Array(linksPerPage)].map((_, i) => {
                    const linkIndex = (linksPage - 1) * linksPerPage + i;
                    return (
                      <LinkPreview key={i} linkId={`proj-${projectId}-link-${linkIndex + 1}`} />
                    );
                  })}
                </div>

                <PaginationControls
                  currentPage={linksPage}
                  totalPages={linksTotalPages}
                  onPageChange={setLinksPage}
                />
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
