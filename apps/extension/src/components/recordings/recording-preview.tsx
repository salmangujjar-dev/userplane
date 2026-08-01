import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';
import { Clock, Link2, Play } from 'lucide-react';
import { useState } from 'react';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { showCopyFailedToast } from '@/lib/toasts';
import { useWorkspaceId } from '@/stores/workspace';

const DASH_URL = import.meta.env.WXT_DASH_URL || 'https://dash-dev.userplane.io';

function ThumbnailFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-muted to-muted/80">
      <div
        className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.15),0_4px_16px_rgba(0,0,0,0.1),0_0_0_8px_rgba(255,255,255,0.1),0_0_0_16px_rgba(255,255,255,0.05)]"
        aria-label="Play recording"
      >
        <svg
          className="w-6 h-6 text-gray-800 ml-0.5"
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
  createdBy: string;
  createdAt: Date;
  expiresAt: Date | null;
  durationMs: number | null;
  thumbnailUrl: string | null;
}

export function RecordingPreview({
  recordingId,
  createdBy,
  createdAt,
  expiresAt,
  durationMs,
  thumbnailUrl,
}: RecordingPreviewProps) {
  const workspaceId = useWorkspaceId();
  const [imageError, setImageError] = useState(false);

  const formatDuration = (ms: number | null) => {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const handleClick = () => {
    if (workspaceId) {
      chrome.tabs.create({
        url: `${DASH_URL}/workspace/${workspaceId}/recordings/${recordingId}`,
      });
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const recordingUrl = `${DASH_URL}/workspace/${workspaceId}/recordings/${recordingId}`;
      await navigator.clipboard.writeText(recordingUrl);
    } catch {
      showCopyFailedToast();
    }
  };

  // Date.now() is impure during render, so sample it once per mount. A
  // seven-day window does not need to tick while the card is on screen.
  const [now] = useState(() => Date.now());

  const isExpiringSoon =
    expiresAt && expiresAt.getTime() - now < 7 * 24 * 60 * 60 * 1000 && expiresAt.getTime() > now;

  const showFallback = !thumbnailUrl || imageError;

  return (
    <div
      className="flex flex-col gap-3 group/card cursor-pointer transition-all duration-300 ease-out"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="rounded-lg border border-transparent group-hover/card:border-border transition-all duration-300 p-3">
        <div className="aspect-video bg-muted overflow-hidden relative rounded-lg">
          {showFallback ? (
            <ThumbnailFallback />
          ) : (
            <img
              src={thumbnailUrl}
              alt="Recording preview"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="absolute top-2 right-2 bg-white hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200 rounded-lg p-1.5 opacity-0 group-hover/card:opacity-100 transition-all duration-300"
                onClick={handleCopyLink}
                aria-label="Copy recording link"
              >
                <Link2 className="h-3.5 w-3.5 text-gray-700" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Copy link</p>
            </TooltipContent>
          </Tooltip>
          {isExpiringSoon && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute bottom-2 left-2 bg-amber-500/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-white" />
                  <span className="text-white text-xs font-medium">Expiring soon</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Expires {expiresAt?.toLocaleDateString()}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
            <Play className="h-3 w-3 text-white fill-white" />
            <span className="text-white text-sm font-medium">{formatDuration(durationMs)}</span>
          </div>
        </div>

        <div className="pt-2 mt-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BoringAvatar name={createdBy} size={AVATAR_SIZES.INLINE} />
              <span className="text-sm font-medium truncate">{createdBy}</span>
            </div>
            <span className="text-sm text-muted-foreground shrink-0">{formatDate(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
