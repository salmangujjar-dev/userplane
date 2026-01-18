'use client';

import { AlertCircleIcon } from 'lucide-react';
import React from 'react';

import { formatDurationReadable } from '../utils/time-format';

interface VideoOverlayProps {
  /** Whether the video has started playing */
  hasStarted: boolean;
  /** Whether there's a playback error */
  hasError: boolean;
  /** Video duration in seconds */
  duration: number;
  /** Callback when big play button is clicked */
  onPlay: () => void;
}

/**
 * Video overlay component for initial play button and error states
 */
export function VideoOverlay({ hasStarted, hasError, duration, onPlay }: VideoOverlayProps) {
  // Error state - shown when video fails to load
  if (hasError) {
    return (
      <>
        <div
          className="custom-video-overlay custom-video-overlay-error"
          aria-label="Video unavailable"
        />
        <div className="custom-big-play-container">
          <div
            className="custom-big-play-button custom-big-play-button-error"
            aria-label="Video unavailable"
          >
            <AlertCircleIcon className="custom-big-play-icon" />
          </div>
        </div>
      </>
    );
  }

  // Big Play Button with Overlay - shown before video starts
  if (!hasStarted) {
    return (
      <>
        {/* Semi-transparent overlay backdrop */}
        <div className="custom-video-overlay" onClick={onPlay} aria-label="Play video" />

        {/* Play button and duration */}
        <div className="custom-big-play-container">
          <button
            className="custom-big-play-button"
            onClick={onPlay}
            aria-label="Play video"
            type="button"
          >
            <svg
              className="custom-big-play-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 5.14v14.72a1 1 0 0 0 1.5.87l11.14-7.36a1 1 0 0 0 0-1.73L9.5 4.27A1 1 0 0 0 8 5.14z" />
            </svg>
          </button>
          {duration > 0 && (
            <div className="custom-big-play-duration">{formatDurationReadable(duration)}</div>
          )}
        </div>
      </>
    );
  }

  return null;
}
