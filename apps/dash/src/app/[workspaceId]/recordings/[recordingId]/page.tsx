'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RecordingDetailNav } from '@/components/navigation/recording-detail-nav';
import { RecordingPlayer } from '@/components/recordings/recording-player';
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
import { DinoError } from '@/components/shared/dino-error';
import {
  useRecording,
  useRecordingVideo,
  useRecordingThumbnail,
} from '@/queries/use-recording-query';
import { Loader2 } from 'lucide-react';

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const recordingId = params.recordingId as string;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: recordingData,
    isLoading: isLoadingRecording,
    error: recordingError,
  } = useRecording(workspaceId, recordingId);
  const { data: videoData, isLoading: isLoadingVideo } = useRecordingVideo(
    workspaceId,
    recordingId
  );
  const { data: thumbnailData } = useRecordingThumbnail(workspaceId, recordingId);

  const deleteRecordingMutation = useDeleteRecording(workspaceId, () => {
    router.push(`/${workspaceId}/recordings`);
  });

  // Show loading state
  if (isLoadingRecording || isLoadingVideo) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading recording...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (recordingError || !recordingData) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <DinoError
          title="Recording not found"
          description={
            recordingError instanceof Error
              ? recordingError.message
              : 'This recording may have been deleted or you may not have access.'
          }
          onGoBack={() => window.history.back()}
          showRetry={false}
        />
      </div>
    );
  }

  const recording = recordingData.recording;
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
            <div className="relative pr-4">
              <RecordingPlayer
                videoSources={videoData?.resource.sources ?? []}
                thumbnailUrl={thumbnailData?.resource.url ?? null}
                durationMs={recording.recordingDurationMs}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={34} minSize={25} className="overflow-hidden">
            <div className="pl-4 h-full">
              <RecordingLogReplayPanel recordingId={recordingId} recording={recording} />
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
