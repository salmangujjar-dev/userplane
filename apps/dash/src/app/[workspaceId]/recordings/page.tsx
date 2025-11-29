'use client';

import { useState } from 'react';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { RecordingPreview } from '@/components/recordings/recording-preview';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { usePagination } from '@/hooks/use-pagination';

export default function RecordingsPage() {
  const [currentPage, setCurrentPage] = usePagination();
  const totalPages = 10;
  const recordingsPerPage = 16; // 4 columns x 4 rows
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

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
                <h2 className="text-lg font-semibold">Your Recordings</h2>
                <p className="text-sm text-muted-foreground">View received recordings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(recordingsPerPage)].map((_, i) => {
                const recordingIndex = (currentPage - 1) * recordingsPerPage + i;
                return <RecordingPreview key={i} recordingId={`rec-${recordingIndex + 1}`} />;
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
