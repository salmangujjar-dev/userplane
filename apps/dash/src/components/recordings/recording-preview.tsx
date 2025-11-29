'use client';

import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace';

interface RecordingPreviewProps {
  recordingId?: string;
  onClick?: () => void;
}

export function RecordingPreview({ recordingId, onClick }: RecordingPreviewProps) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (recordingId && workspaceId) {
      router.push(`/${workspaceId}/recordings/${recordingId}`);
    }
  };

  return (
    <div
      className="aspect-video rounded-xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={handleClick}
    />
  );
}
