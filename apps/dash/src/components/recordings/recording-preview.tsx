'use client';

import { toast } from '@workspace/ui/components/sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Link2, Play } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BoringAvatar } from '@/components/shared/boring-avatar';
import { useWorkspaceStore } from '@/stores/workspace';

function ThumbnailFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-muted to-muted/80">
      <div
        className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.15),0_4px_16px_rgba(0,0,0,0.1),0_0_0_8px_rgba(255,255,255,0.1),0_0_0_16px_rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.2),0_6px_20px_rgba(0,0,0,0.15),0_0_0_10px_rgba(255,255,255,0.15),0_0_0_20px_rgba(255,255,255,0.08)]"
        aria-label="Play recording"
      >
        <svg
          className="w-8 h-8 text-gray-800 ml-1"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 5.14v14.72a1 1 0 0 0 1.5.87l11.14-7.36a1 1 0 0 0 0-1.73L9.5 4.27A1 1 0 0 0 8 5.14z" />
        </svg>
      </div>
    </div>
  );
}

interface RecordingPreviewProps {
  recordingId: string;
  onClick?: () => void;
  createdBy: string;
  createdAt: string | Date;
  durationMs: number | null;
  thumbnailUrl: string | null;
}

export function RecordingPreview({
  recordingId,
  onClick,
  createdBy,
  createdAt,
  durationMs,
  thumbnailUrl,
}: RecordingPreviewProps) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDuration = (ms: number | null) => {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const displayDuration = formatDuration(durationMs);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (workspaceId) {
      router.push(`/${workspaceId}/recordings/${recordingId}`);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const recordingUrl = `${window.location.origin}/${workspaceId}/recordings/${recordingId}`;
      await navigator.clipboard.writeText(recordingUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const showFallback = !thumbnailUrl || imageError;
  const staticImageUrl = thumbnailUrl || '';
  // TODO: Add animated GIF URL later (don't worry about it for now)
  const animatedGifUrl = thumbnailUrl || '';

  return (
    <div
      className="flex flex-col gap-3 group/card cursor-pointer transition-all duration-300 ease-out hover:z-10"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="rounded-lg border border-transparent group-hover/card:border-border transition-all duration-300 p-3">
        <div className="aspect-video bg-muted overflow-hidden relative rounded-lg">
          {showFallback ? (
            <ThumbnailFallback />
          ) : (
            <Image
              src={isHovered ? animatedGifUrl : staticImageUrl}
              alt="Recording preview"
              className="w-full h-full object-cover"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
              onError={() => setImageError(true)}
            />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="absolute top-3 right-3 bg-white hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200 rounded-lg p-2 opacity-0 group-hover/card:opacity-100 transition-all duration-300"
                onClick={handleCopyLink}
                aria-label="Copy recording link"
              >
                <Link2 className="h-4 w-4 text-gray-700" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Copy link</p>
            </TooltipContent>
          </Tooltip>
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Play className="h-3 w-3 text-white fill-white" />
            <span className="text-white text-sm font-medium">{displayDuration}</span>
          </div>
        </div>

        <div className="pt-2 mt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BoringAvatar name={createdBy} size={24} />
              <span className="text-sm font-medium truncate">{createdBy}</span>
            </div>
            <span className="text-sm text-muted-foreground shrink-0">{formatDate(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
