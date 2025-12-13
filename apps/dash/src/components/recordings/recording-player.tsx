'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { VideoMarker } from '@/components/player/types';
import './recording-player.css';

const VideoPlayer = dynamic(() => import('@/components/player'), {
  ssr: false,
});

export function RecordingPlayer() {
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

  // Sample video configuration - useMemo to prevent recreating on every render
  // Replace with actual recording data from props or API
  const videoOptions = React.useMemo(
    () => ({
      controls: true,
      responsive: true,
      fluid: true,
      sources: [
        {
          src: 'https://customer-9o3ovno0sscvd4n0.cloudflarestream.com/d9ec8ed1f01cfaa79099e83808db6540/manifest/video.m3u8',
          type: 'application/x-mpegURL',
        },
      ],
    }),
    []
  );

  // Sample markers for timeline annotations - useMemo to prevent recreating
  // Replace with actual marker data from props or API
  const markers: VideoMarker[] = React.useMemo(
    () => [
      { time: 5, label: 'Button Click', color: '#fbbf24' },
      { time: 15, label: 'Form Submit', color: '#3b82f6' },
      { time: 30, label: 'Page Navigation', color: '#10b981' },
    ],
    []
  );

  const poster = React.useMemo(
    () =>
      'https://customer-9o3ovno0sscvd4n0.cloudflarestream.com/d9ec8ed1f01cfaa79099e83808db6540/thumbnails/thumbnail.jpg?time=0s&height=600',
    []
  );

  return (
    <div
      className={`recording-player-container ${isFullscreen ? 'fullscreen' : ''}`}
      data-fullscreen={isFullscreen}
    >
      {/* Overlay backdrop for fullscreen */}
      {isFullscreen && <div className="recording-player-overlay" onClick={toggleFullscreen} />}

      {/* Single VideoPlayer instance that persists */}
      <div className="recording-player-content">
        <VideoPlayer
          key="video-player-persistent"
          options={videoOptions}
          markers={markers}
          poster={poster}
          onFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
