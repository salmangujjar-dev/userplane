'use client';

import './recording-player.css';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

import type { VideoMarker } from '@/components/player/types';

const StreamPlayer = dynamic(() => import('@/components/player'), {
  ssr: false,
});

interface VideoSource {
  url: string;
  type: string;
}

interface RecordingPlayerProps {
  videoSources: VideoSource[];
  thumbnailUrl: string | null;
  durationMs: number;
  markers?: VideoMarker[];
}

export function RecordingPlayer({
  videoSources,
  thumbnailUrl,
  durationMs,
  markers = [],
}: RecordingPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = React.useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Video configuration with actual recording data
  const videoOptions = React.useMemo(() => {
    if (!videoSources || videoSources.length === 0) {
      return null;
    }

    return {
      controls: true,
      responsive: true,
      fluid: true,
      sources: videoSources.map((source) => ({
        src: source.url,
        type: source.type,
      })),
    };
  }, [videoSources]);

  const poster = React.useMemo(() => thumbnailUrl ?? undefined, [thumbnailUrl]);

  // Show loading or error state if no video URL
  if (!videoOptions) {
    return (
      <div className="recording-player-container">
        <div className="flex items-center justify-center h-[500px] bg-muted rounded-lg">
          <p className="text-muted-foreground">Video not available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`recording-player-container ${isFullscreen ? 'fullscreen' : ''}`}
      data-fullscreen={isFullscreen}
    >
      {/* Overlay backdrop for fullscreen */}
      {isFullscreen && <div className="recording-player-overlay" onClick={toggleFullscreen} />}

      {/* Single StreamPlayer instance that persists */}
      <div className="recording-player-content">
        <StreamPlayer
          key="stream-player-persistent"
          options={videoOptions}
          markers={markers}
          poster={poster}
          durationMs={durationMs}
          onFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
