'use client';

import dynamic from 'next/dynamic';
import type { VideoMarker } from '@/components/player/types';

const VideoPlayer = dynamic(() => import('@/components/player'), {
  ssr: false,
});

export function RecordingPlayer() {
  // Sample video configuration
  // Replace with actual recording data from props or API
  const videoOptions = {
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: 'https://customer-9o3ovno0sscvd4n0.cloudflarestream.com/d9ec8ed1f01cfaa79099e83808db6540/manifest/video.m3u8',
        type: 'application/x-mpegURL',
      },
    ],
  };

  // Sample markers for timeline annotations
  // Replace with actual marker data from props or API
  const markers: VideoMarker[] = [
    { time: 5, label: 'Button Click', color: '#fbbf24' },
    { time: 15, label: 'Form Submit', color: '#3b82f6' },
    { time: 30, label: 'Page Navigation', color: '#10b981' },
  ];

  const poster =
    'https://customer-9o3ovno0sscvd4n0.cloudflarestream.com/d9ec8ed1f01cfaa79099e83808db6540/thumbnails/thumbnail.jpg?time=0s&height=600';

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] rounded-2xl bg-muted p-4 flex items-center justify-center">
      <div className="relative w-full">
        <VideoPlayer options={videoOptions} markers={markers} poster={poster} />
      </div>
    </div>
  );
}
