'use client';

import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector';
import './stream-player.css';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';

import { showRecordingCannotBePlayedToast } from '@/lib/toasts';

import StreamControls from './StreamControls';
import type { Player, PlayerOptions, VideoMarker } from './types';

const EMPTY_MARKERS: VideoMarker[] = [];

interface StreamPlayerProps {
  options: PlayerOptions;
  markers?: VideoMarker[];
  poster?: string | null;
  durationMs?: number;
  onPlayerReady?: (player: Player) => void;
  onFullscreen?: () => void;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({
  options,
  markers = EMPTY_MARKERS,
  poster = null,
  durationMs,
  onPlayerReady,
  onFullscreen,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [duration, setDuration] = useState<number>(durationMs ? durationMs / 1000 : 0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      // Suppress Video.js error logging - we handle errors ourselves
      videojs.log.level('off');

      // Merge options with disabled controls and big play button
      const playerOptions: PlayerOptions = {
        ...options,
        controls: false,
        bigPlayButton: false,
        errorDisplay: false,
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
      };

      const player = (playerRef.current = videojs(videoElement, playerOptions, () => {
        // Notify parent component that player is ready
        if (onPlayerReady) {
          onPlayerReady(player);
        }
      }) as Player);

      // Listen for loadedmetadata to get duration (only if not provided via props)
      player.on('loadedmetadata', () => {
        if (!durationMs) {
          setDuration(player.duration() || 0);
        }
      });

      // Also try to get duration when it changes (only if not provided via props)
      player.on('durationchange', () => {
        if (!durationMs) {
          setDuration(player.duration() || 0);
        }
      });

      // Track when video starts playing
      player.on('play', () => {
        setHasStarted(true);
      });

      // Track video errors
      player.on('error', () => {
        setHasError(true);
        showRecordingCannotBePlayedToast();
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
  }, [options, poster, onPlayerReady, durationMs]);

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

  // Handle container hover with delay
  const handleContainerMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
    // Show controls immediately
    setShowControls(true);
  };

  const handleContainerMouseLeave = () => {
    // Wait 1.5 seconds before hiding controls
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      hideControlsTimeoutRef.current = null;
    }, 1500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // Handle click on video to toggle play/pause
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const player = playerRef.current;
    if (!player) return;

    // Only toggle if clicking on the video itself, not on controls
    const target = e.target as HTMLElement;
    if (target.closest('.custom-video-controls') || target.closest('.custom-big-play-button')) {
      return;
    }

    // Toggle play/pause
    if (player.paused()) {
      player.play();
    } else {
      player.pause();
    }
  };

  // Disable right-click context menu
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      data-vjs-player
      className="video-player-container"
      onMouseEnter={handleContainerMouseEnter}
      onMouseLeave={handleContainerMouseLeave}
      onContextMenu={handleContextMenu}
    >
      <div
        ref={videoRef}
        className="video-player-wrapper"
        role="button"
        tabIndex={0}
        onClick={handleVideoClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const player = playerRef.current;
            if (player) {
              if (player.paused()) {
                player.play();
              } else {
                player.pause();
              }
            }
          }
        }}
      />

      {/* Custom controls */}
      <StreamControls
        player={playerRef.current}
        markers={markers}
        onFullscreen={onFullscreen}
        duration={duration}
        hasStarted={hasStarted}
        showControls={showControls}
        hasError={hasError}
      />
    </div>
  );
};

export default StreamPlayer;
