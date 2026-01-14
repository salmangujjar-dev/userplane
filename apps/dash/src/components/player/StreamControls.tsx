'use client';

import React, { useState, useCallback } from 'react';
import { MaximizeIcon } from 'lucide-react';
import type { Player } from './types';
import type { VideoMarker } from './types';
import { useVideoPlayer } from './hooks';
import {
  VideoOverlay,
  VideoProgressBar,
  PlaybackControls,
  QualityControl,
  SpeedControl,
  VolumeControlInline,
} from './components';
import './stream-controls.css';

interface StreamControlsProps {
  player: Player | null;
  markers?: VideoMarker[];
  onFullscreen?: () => void;
  duration?: number;
  hasStarted?: boolean;
  showControls?: boolean;
  hasError?: boolean;
}

const StreamControls: React.FC<StreamControlsProps> = ({
  player,
  markers = [],
  onFullscreen,
  duration: videoDuration = 0,
  hasStarted = false,
  showControls = false,
  hasError = false,
}) => {
  // Use centralized player state management
  const [playerState, playerActions] = useVideoPlayer(player, { videoDuration });

  // Track which dropdown is open to close others
  const [activeDropdown, setActiveDropdown] = useState<'quality' | 'speed' | null>(null);

  // Handle big play button click
  const handleBigPlayClick = useCallback(() => {
    if (!player) return;
    player.play();
  }, [player]);

  // Handle dropdown open/close coordination
  const handleQualityOpenChange = useCallback((isOpen: boolean) => {
    setActiveDropdown(isOpen ? 'quality' : null);
  }, []);

  const handleSpeedOpenChange = useCallback((isOpen: boolean) => {
    setActiveDropdown(isOpen ? 'speed' : null);
  }, []);

  return (
    <>
      {/* Video overlay (play button, error state) */}
      <VideoOverlay
        hasStarted={hasStarted}
        hasError={hasError}
        duration={videoDuration}
        onPlay={handleBigPlayClick}
      />

      {/* Control Bar - hidden when there's an error */}
      {!hasError && (
        <div
          className="custom-video-controls"
          data-show-controls={showControls || !hasStarted}
          data-initial-state={!hasStarted}
        >
          {/* Progress Bar */}
          <VideoProgressBar
            currentTime={playerState.currentTime}
            duration={playerState.duration}
            markers={markers}
            onSeek={playerActions.seek}
          />

          {/* Control buttons */}
          <div className="custom-controls-bar">
            {/* Left side - Play and Time */}
            <PlaybackControls
              isPlaying={playerState.isPlaying}
              currentTime={playerState.currentTime}
              duration={playerState.duration}
              onTogglePlay={playerActions.togglePlay}
            />

            {/* Right side - Quality, Speed, Volume and Fullscreen */}
            <div className="custom-controls-right">
              {/* Quality selector */}
              <QualityControl
                qualities={playerState.qualities}
                currentQuality={playerState.currentQuality}
                onQualitySelect={playerActions.handleQualitySelect}
                onOpenChange={handleQualityOpenChange}
                forceClose={activeDropdown === 'speed'}
              />

              {/* Speed selector */}
              <SpeedControl
                playbackSpeed={playerState.playbackSpeed}
                onSpeedSelect={playerActions.handleSpeedSelect}
                onOpenChange={handleSpeedOpenChange}
                forceClose={activeDropdown === 'quality'}
              />

              {/* Volume control */}
              <VolumeControlInline
                volume={playerState.volume}
                isMuted={playerState.isMuted}
                onVolumeChange={playerActions.handleVolumeChange}
                onToggleMute={playerActions.toggleMute}
              />

              {/* Fullscreen button */}
              {onFullscreen && (
                <button
                  className="custom-control-button"
                  onClick={onFullscreen}
                  aria-label="Fullscreen"
                  type="button"
                >
                  <MaximizeIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StreamControls;
