import type { App } from '@modelcontextprotocol/ext-apps';
import { useCallback, useState } from 'react';

import { PlayIcon, RefreshCwIcon } from '../shared/icons';
import { formatDuration } from '../shared/utils';

interface VideoPlayerProps {
  app: App;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationMs: number;
  workspaceId: string;
  recordingId: string;
}

export function VideoPlayer({
  app,
  videoUrl,
  thumbnailUrl,
  durationMs,
  workspaceId,
  recordingId,
}: VideoPlayerProps) {
  const [currentVideoUrl, setCurrentVideoUrl] = useState(videoUrl);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState(thumbnailUrl);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await app.callServerTool({
        name: 'userplane_app_refresh_recording_urls',
        arguments: { workspaceId, recordingId },
      });
      const textContent = result.content?.find((c: { type: string }) => c.type === 'text');
      if (textContent && textContent.type === 'text') {
        const text = textContent.text;
        const data = JSON.parse(text);
        if (data.video?.url) setCurrentVideoUrl(data.video.url);
        if (data.thumbnail?.url) setCurrentThumbnailUrl(data.thumbnail.url);
        setError(false);
      }
    } catch {
      // Refresh failed — keep error state
    } finally {
      setRefreshing(false);
    }
  }, [app, workspaceId, recordingId]);

  if (!currentVideoUrl || error) {
    return (
      <div className="relative aspect-video bg-muted flex items-center justify-center">
        {/* Thumbnail background when available */}
        {currentThumbnailUrl && !error && (
          <img
            src={currentThumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}

        {/* Fallback content */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          {error ? (
            <>
              <p className="text-sm text-muted-foreground">Video unavailable</p>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCwIcon className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <PlayIcon className="w-6 h-6 text-gray-800 ml-0.5" />
              </div>
              <span className="text-sm text-muted-foreground">{formatDuration(durationMs)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black">
      <video
        controls
        preload="metadata"
        poster={currentThumbnailUrl ?? undefined}
        onError={() => setError(true)}
        className="w-full aspect-video"
      >
        <source src={currentVideoUrl} type="video/webm" />
        <source src={currentVideoUrl} type="video/mp4" />
      </video>
    </div>
  );
}
