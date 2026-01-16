'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RecordingDetailNav } from '@/components/navigation/recording-detail-nav';
import { RecordingPlayer } from '@/components/recordings/recording-player';
import { RecordingLogReplayPanel } from '@/components/recordings/recording-log-replay-panel';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
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
import { RecordingDetailSkeleton } from '@/components/skeleton';
import { useWorkspaceRole } from '@/hooks/use-workspace-role';

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const recordingId = params.recordingId as string;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const {
    data: recordingResult,
    isLoading: isLoadingRecording,
    error: recordingError,
  } = useRecording(workspaceId, recordingId);
  const recordingData = recordingResult?.success ? recordingResult.data : null;

  const { data: videoResult, isLoading: isLoadingVideo } = useRecordingVideo(
    workspaceId,
    recordingId
  );
  const videoData = videoResult?.success ? videoResult.data : null;

  const { data: thumbnailResult } = useRecordingThumbnail(workspaceId, recordingId);
  const thumbnailData = thumbnailResult?.success ? thumbnailResult.data : null;

  const deleteRecordingMutation = useDeleteRecording(workspaceId, () => {
    router.push(`/${workspaceId}/recordings`);
  });

  const { data: roleResult } = useWorkspaceRole();
  const membership = roleResult?.success ? roleResult.data : null;

  // Show loading state
  if (isLoadingRecording || isLoadingVideo) {
    return <RecordingDetailSkeleton />;
  }

  // Show error state
  if (recordingError || (recordingResult && !recordingResult.success) || !recordingData) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <DinoError
          title="Recording not found"
          description={
            recordingError instanceof Error
              ? recordingError.message
              : recordingResult && !recordingResult.success
                ? recordingResult.error.message
                : 'This recording may have been deleted or you may not have access.'
          }
          onGoBack={() => window.history.back()}
          showRetry={false}
        />
      </div>
    );
  }

  const recording = recordingData.recording;

  // Check permission: admin/owner OR creator can delete
  const isAdminOrOwner =
    membership?.workspaceRole === 'admin' || membership?.workspaceRole === 'owner';
  const isCreator = membership?.workspaceMemberId === recording.meta.creator.workspaceMemberId;
  const canDelete = isAdminOrOwner || isCreator;

  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = () => {
    const currentUrl = window.location.href;
    setShareLink(currentUrl);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <RecordingDetailNav
        onCopyLink={handleCopyLink}
        onShare={handleShare}
        onDelete={canDelete ? () => setShowDeleteModal(true) : undefined}
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

      <ShareLinkModal
        link={shareLink || ''}
        open={!!shareLink}
        onClose={() => setShareLink(null)}
      />
    </div>
  );
}
