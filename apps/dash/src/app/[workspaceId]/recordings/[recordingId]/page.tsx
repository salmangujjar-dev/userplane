'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RecordingDetailNav } from '@/components/navigation/recording-detail-nav';
import { RecordingPlayer } from '@/components/recordings/recording-player';
import { RecordingMetaPanel } from '@/components/recordings/recording-meta-panel';
import { RecordingLogReplayPanel } from '@/components/recordings/recording-log-replay-panel';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { toast } from '@workspace/ui/components/sonner';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@workspace/ui/components/resizable';
import { useWorkspaceId } from '@/stores/workspace';
import { useDeleteRecording } from '@/queries/use-recording-mutations';

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const recordingId = params.recordingId as string;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteRecordingMutation = useDeleteRecording(workspaceId, () => {
    router.push(`/${workspaceId}/recordings`);
  });
  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareLink = async () => {
    const currentUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share Your Screen',
          text: 'Submit a Screen Capture',
          url: currentUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share link');
        }
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleShareAtTimestamp = async () => {
    // TODO: Get current timestamp from video player
    const currentUrl = window.location.href;
    const urlWithTimestamp = `${currentUrl}?t=00:00`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share Your Screen at 00:00',
          text: 'Submit a Screen Capture at timestamp',
          url: urlWithTimestamp,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share link');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(urlWithTimestamp);
        toast.success('Link with timestamp copied to clipboard');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <RecordingDetailNav
        onCopyLink={handleCopyLink}
        onShareLink={handleShareLink}
        onShareAtTimestamp={handleShareAtTimestamp}
        onDelete={() => setShowDeleteModal(true)}
      />

      <main className="w-full pl-4 overflow-hidden flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg overflow-hidden">
          <ResizablePanel defaultSize={66} minSize={30} className="overflow-y-auto">
            <div className="relative pr-4 space-y-6">
              <RecordingPlayer />
              <RecordingMetaPanel />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={34} minSize={25} className="overflow-hidden">
            <div className="pl-4 h-full">
              <RecordingLogReplayPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        itemName={recordingId}
        itemType="recording"
        onConfirm={() => deleteRecordingMutation.mutate(recordingId)}
        isLoading={deleteRecordingMutation.isPending}
      />
    </div>
  );
}
