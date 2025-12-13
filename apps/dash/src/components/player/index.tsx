'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector';
import './VideoPlayer.css';
import Tooltip from './Tooltip';
import type { VideoMarker, Player, PlayerOptions } from './types';

interface VideoPlayerProps {
  options: PlayerOptions;
  markers?: VideoMarker[];
  poster?: string | null;
  onPlayerReady?: (player: Player) => void;
}

interface ActiveMarker extends VideoMarker {
  index: number;
  element: HTMLElement;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  options,
  markers = [],
  poster = null,
  onPlayerReady,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const markersRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [activeMarker, setActiveMarker] = useState<ActiveMarker | null>(null);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      // Merge options with custom control bar configuration and HLS settings
      const playerOptions: PlayerOptions = {
        ...options,
        ...(poster && { poster }),
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            useBandwidthFromLocalStorage: true,
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
        controlBar: {
          children: [
            'playToggle',
            'progressControl',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'fullscreenToggle',
          ],
        },
      };

      const player = (playerRef.current = videojs(videoElement, playerOptions, () => {
        // Notify parent component that player is ready
        if (onPlayerReady) {
          onPlayerReady(player);
        }
      }) as Player);

      // Listen for loadedmetadata to get duration
      player.on('loadedmetadata', () => {
        setDuration(player.duration() || 0);
      });

      // Also try to get duration when it changes
      player.on('durationchange', () => {
        setDuration(player.duration() || 0);
      });

      // Track when video starts playing
      player.on('play', () => {
        setHasStarted(true);
      });
    } else if (playerRef.current) {
      const player = playerRef.current;
      if (options.autoplay !== undefined) {
        player.autoplay(options.autoplay);
      }
      if (options.sources) {
        player.src(options.sources);
      }
    }
  }, [options, poster, onPlayerReady]);

  // Dispose the Video.js player when the component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Add markers to the progress bar
  useEffect(() => {
    if (duration > 0 && markers.length > 0 && playerRef.current) {
      const progressHolder = document.querySelector('.video-js .vjs-progress-holder');

      if (progressHolder && !markersRef.current) {
        // Create markers container
        const markersContainer = document.createElement('div');
        markersContainer.className = 'vjs-markers-container';
        progressHolder.appendChild(markersContainer);
        markersRef.current = markersContainer;

        // Add markers
        markers.forEach((marker, index) => {
          const position = (marker.time / duration) * 100;

          // Create marker dot
          const markerEl = document.createElement('div');
          markerEl.className = 'vjs-marker';
          markerEl.style.left = `${position}%`;
          markerEl.dataset.index = String(index);

          // Set custom color if provided
          if (marker.color) {
            markerEl.style.backgroundColor = marker.color;
          }

          // Add hover events
          markerEl.addEventListener('mouseenter', (e) => {
            setActiveMarker({
              ...marker,
              index,
              element: e.target as HTMLElement,
            });
          });

          markerEl.addEventListener('mouseleave', () => {
            setActiveMarker(null);
          });

          // Click to seek
          markerEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (playerRef.current) {
              playerRef.current.currentTime(marker.time);
            }
          });

          markersContainer.appendChild(markerEl);
        });
      }
    }

    // Cleanup markers on unmount
    return () => {
      if (markersRef.current) {
        markersRef.current.remove();
        markersRef.current = null;
      }
    };
  }, [duration, markers]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div data-vjs-player className="video-player-container">
      <div ref={videoRef} className="video-player-wrapper" />

      {/* Duration badge below play button - only shown before video starts */}
      {duration > 0 && !hasStarted && (
        <div className="vjs-duration-badge">{formatTime(duration)}</div>
      )}

      {/* Custom tooltip for markers */}
      <Tooltip marker={activeMarker} containerRef={videoRef} />
    </div>
  );
};

export default VideoPlayer;
