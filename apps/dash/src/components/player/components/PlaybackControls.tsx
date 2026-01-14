'use client';

import React from 'react';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { formatTimeCompact } from '../utils/time-format';

interface PlaybackControlsProps {
  /** Whether video is currently playing */
  isPlaying: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Callback to toggle play/pause */
  onTogglePlay: () => void;
}

/**
 * Play/pause button and time display component
 */
export function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
}: PlaybackControlsProps) {
  return (
    <div className="custom-controls-left">
      <button
        className="custom-control-button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        type="button"
      >
        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
      </button>

      <div className="custom-time-display">
        <span className="custom-time-current">{formatTimeCompact(currentTime)}</span>
        <span className="custom-time-separator">/</span>
        <span className="custom-time-duration">{formatTimeCompact(duration)}</span>
      </div>
    </div>
  );
}
