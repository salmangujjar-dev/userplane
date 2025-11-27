'use client';

import { useRouter } from 'next/navigation';

interface RecordingPreviewProps {
  recordingId?: string;
  onClick?: () => void;
}

export function RecordingPreview({ recordingId, onClick }: RecordingPreviewProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (recordingId) {
      router.push(`/recordings/${recordingId}`);
    }
  };

  return (
    <div
      className="aspect-video rounded-xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={handleClick}
    />
  );
}
