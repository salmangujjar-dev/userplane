'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector';
import './VideoPlayer.css';
import CustomControls from './CustomControls';
import type { VideoMarker, Player, PlayerOptions } from './types';

interface VideoPlayerProps {
  options: PlayerOptions;
  markers?: VideoMarker[];
  poster?: string | null;
  onPlayerReady?: (player: Player) => void;
  onFullscreen?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  options,
  markers = [],
  poster = null,
  onPlayerReady,
  onFullscreen,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      // Merge options with disabled controls and big play button
      const playerOptions: PlayerOptions = {
        ...options,
        controls: false,
        bigPlayButton: false,
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

  return (
    <div
      data-vjs-player
      className="video-player-container"
      onMouseEnter={handleContainerMouseEnter}
      onMouseLeave={handleContainerMouseLeave}
    >
      <div ref={videoRef} className="video-player-wrapper" />

      {/* Custom controls */}
      <CustomControls
        player={playerRef.current}
        markers={markers}
        onFullscreen={onFullscreen}
        duration={duration}
        hasStarted={hasStarted}
        showControls={showControls}
      />
    </div>
  );
};

export default VideoPlayer;
