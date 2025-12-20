'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useWorkspaceStore } from '@/stores/workspace';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { Play, Link2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@workspace/ui/components/sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface RecordingPreviewProps {
  recordingId?: string;
  onClick?: () => void;
  createdBy?: string;
  createdAt?: string | Date;
  durationMs?: number | null;
  thumbnailUrl?: string | null;
}

const SAMPLE_CREATORS = [
  'Alice Johnson',
  'Carol Williams',
  'David Brown',
  'Emma Davis',
  'Lary Bird',
  'Frank Miller',
];

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

  const getRecordingIndex = (id: string) => {
    const match = id?.match(/\d+$/);
    return match ? parseInt(match[0], 10) : 0;
  };

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

  const recordingIndex = recordingId ? getRecordingIndex(recordingId) : 0;
  const displayCreator =
    createdBy || SAMPLE_CREATORS[recordingIndex % SAMPLE_CREATORS.length] || 'Unknown Creator';
  const displayDate = createdAt || new Date(Date.now() - recordingIndex * 86400000 * 2);
  const displayDuration = formatDuration(durationMs ?? null);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (recordingId && workspaceId) {
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

  const staticImageUrl =
    thumbnailUrl ||
    'https://jam.dev/cdn-cgi/image/width=480,quality=100,dpr=2/https://cdn-jam-screenshots.jam.dev/bba0f128dfa4507c1e4549c3b11f090e/screenshot/f310785e-327e-40c8-8728-59521d9b8176.png';
  const animatedGifUrl = thumbnailUrl
    ? `${thumbnailUrl}?animated=true`
    : 'https://customer-9o3ovno0sscvd4n0.cloudflarestream.com/d9ec8ed1f01cfaa79099e83808db6540/thumbnails/thumbnail.gif?width=480&duration=4s';

  return (
    <div
      className="flex flex-col gap-3 group/card cursor-pointer transition-all duration-300 ease-out hover:z-10"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="rounded-lg border border-transparent group-hover/card:border-border transition-all duration-300 p-3">
        <div className="aspect-video bg-muted overflow-hidden relative rounded-lg">
          {thumbnailUrl ? (
            <Image
              src={isHovered ? animatedGifUrl : staticImageUrl}
              alt="Recording preview"
              className="w-full h-full object-cover"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
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
              <BoringAvatar name={displayCreator} size={24} />
              <span className="text-sm font-medium truncate">{displayCreator}</span>
            </div>
            <span className="text-sm text-muted-foreground shrink-0">
              {formatDate(displayDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
