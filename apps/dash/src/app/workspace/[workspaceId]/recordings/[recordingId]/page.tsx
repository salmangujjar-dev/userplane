'use client';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@workspace/ui/components/resizable';
import { useParams, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useState } from 'react';

import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { EditRecordingModal } from '@/components/modals/edit-recording-modal';
import { ShareRecordingModal } from '@/components/modals/share-recording-modal';
import { RecordingDetailNav } from '@/components/navigation/recording-detail-nav';
import { RecordingLogReplayPanel } from '@/components/recordings/recording-log-replay-panel';
import { RecordingPlayer } from '@/components/recordings/recording-player';
import { RecordingDetailSkeleton } from '@/components/skeleton';
import {
  useDeleteRecording,
  useRecording,
  useRecordingThumbnail,
  useRecordingVideo,
  useUpdateRecordingExpiry,
} from '@/features/recordings';
import { useWorkspaceRole } from '@/features/workspace';
import { showCopiedToClipboardToast, showCopyFailedToast } from '@/lib/toasts';
import { useWorkspaceId } from '@/stores/workspace';

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const recordingId = params.recordingId as string;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
    router.push(`/workspace/${workspaceId}/recordings`);
  });

  const updateExpiryMutation = useUpdateRecordingExpiry(workspaceId);

  const { data: roleResult } = useWorkspaceRole();
  const membership = roleResult?.success ? roleResult.data : null;

  // Show loading state
  if (isLoadingRecording || isLoadingVideo) {
    return <RecordingDetailSkeleton />;
  }

  // Show error state - trigger the pretty not-found page
  if (recordingError || (recordingResult && !recordingResult.success) || !recordingData) {
    notFound();
  }

  const recording = recordingData.recording;

  // Check permission: admin/owner OR creator can edit/delete
  const isAdminOrOwner =
    membership?.workspaceRole === 'admin' || membership?.workspaceRole === 'owner';
  const isCreator = membership?.workspaceMemberId === recording.meta.creator.workspaceMemberId;
  const canEdit = isAdminOrOwner || isCreator;
  const canDelete = isAdminOrOwner || isCreator;

  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      showCopiedToClipboardToast();
    } catch {
      showCopyFailedToast();
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <RecordingDetailNav
        onCopyLink={handleCopyLink}
        onShare={handleShare}
        onEdit={canEdit ? () => setShowEditModal(true) : undefined}
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

      <EditRecordingModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        currentExpiresAt={recording.meta.expiresAt}
        onSave={(expiresAt) => updateExpiryMutation.mutate({ recordingId, expiresAt })}
        isLoading={updateExpiryMutation.isPending}
      />

      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        itemName={recordingId}
        itemType="recording"
        onConfirm={() => deleteRecordingMutation.mutate(recordingId)}
        isLoading={deleteRecordingMutation.isPending}
      />

      <ShareRecordingModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        recordingId={recordingId}
      />
    </div>
  );
}
