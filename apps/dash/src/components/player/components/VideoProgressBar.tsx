'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { VideoMarker } from '../types';
import { formatTimeCompact } from '../utils/time-format';

const EMPTY_MARKERS: VideoMarker[] = [];

interface VideoProgressBarProps {
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Timeline markers to display */
  markers?: VideoMarker[];
  /** Callback when user seeks to a new time */
  onSeek: (time: number) => void;
  /**
   * Callback when user clicks a marker. When provided, clicking (or keyboard-activating)
   * a marker fires this instead of a seek. Markers without `kind` stay purely visual.
   */
  onMarkerClick?: (marker: VideoMarker) => void;
}

/**
 * Video progress bar component with scrubbing, markers, and hover tooltip.
 * Handles all progress bar interactions including drag-to-scrub.
 */
export function VideoProgressBar({
  currentTime,
  duration,
  markers = EMPTY_MARKERS,
  onSeek,
  onMarkerClick,
}: VideoProgressBarProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hover state
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [activeMarker, setActiveMarker] = useState<VideoMarker | null>(null);

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Calculate time from mouse position
  const getTimeFromPosition = useCallback(
    (clientX: number): number => {
      if (!progressBarRef.current) return 0;
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return percent * duration;
    },
    [duration]
  );

  // Handle click to seek. If hovering a marker with an onMarkerClick handler,
  // fire the marker click instead of seeking.
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMarker && onMarkerClick) {
      onMarkerClick(activeMarker);
      return;
    }
    const newTime = getTimeFromPosition(e.clientX);
    onSeek(newTime);
  };

  // Handle mouse move for hover tooltip
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const time = getTimeFromPosition(e.clientX);
    setHoverTime(time);
    setHoverPosition(e.clientX - rect.left);

    // Check if hovering over a marker
    const hoveredMarker = markers.find((marker) => {
      const markerPercent = marker.time / duration;
      const markerPosition = markerPercent * rect.width;
      return Math.abs(e.clientX - rect.left - markerPosition) < 8;
    });
    setActiveMarker(hoveredMarker || null);
  };

  // Handle mouse down for drag-to-scrub. Suppress drag when the click is consumed
  // by an actionable marker so the user doesn't accidentally scrub after clicking.
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMarker && onMarkerClick) {
      handleProgressClick(e);
      return;
    }
    isDraggingRef.current = true;
    handleProgressClick(e);
  };

  const handleProgressMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Handle mouse enter with tooltip delay clear
  const handleProgressMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setIsHovering(true);
  };

  // Handle mouse leave with delayed tooltip hide
  const handleProgressMouseLeave = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
      setHoverTime(null);
      setHoverPosition(null);
      setActiveMarker(null);
      tooltipTimeoutRef.current = null;
    }, 1500);
  };

  // Global mouse event handlers for drag-to-scrub
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const newTime = getTimeFromPosition(e.clientX);
        onSeek(newTime);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [getTimeFromPosition, onSeek]);

  return (
    <div
      ref={progressBarRef}
      className="custom-progress-container"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSeek(currentTime);
        }
      }}
      onMouseDown={handleProgressMouseDown}
      onMouseUp={handleProgressMouseUp}
      onMouseEnter={handleProgressMouseEnter}
      onMouseLeave={handleProgressMouseLeave}
      onMouseMove={handleProgressMouseMove}
    >
      {/* Progress bar background */}
      <div className="custom-progress-bar">
        {/* Played progress */}
        <div className="custom-progress-played" style={{ width: `${progress}%` }} />

        {/* Hover tooltip */}
        {isHovering && hoverTime !== null && hoverPosition !== null && (
          <div
            className={`custom-progress-tooltip${
              activeMarker && onMarkerClick && activeMarker.kind
                ? ' custom-progress-tooltip--clickable'
                : ''
            }`}
            style={{ left: `${hoverPosition}px` }}
            onMouseDown={
              activeMarker && onMarkerClick && activeMarker.kind
                ? (e) => {
                    e.stopPropagation();
                    onMarkerClick(activeMarker);
                  }
                : undefined
            }
          >
            {activeMarker ? (
              <>
                <div
                  className="custom-progress-tooltip-marker"
                  style={{ color: activeMarker.color }}
                >
                  {activeMarker.label}
                </div>
                <div className="custom-progress-tooltip-time">
                  {formatTimeCompact(activeMarker.time)}
                </div>
              </>
            ) : (
              <div className="custom-progress-tooltip-time">{formatTimeCompact(hoverTime)}</div>
            )}
          </div>
        )}

        {/* Markers */}
        {markers.map((marker, index) => {
          const markerPosition = duration > 0 ? (marker.time / duration) * 100 : 0;
          const isActionable = !!(onMarkerClick && marker.kind);
          return (
            <div
              key={`marker-${index}-${marker.time}`}
              className="custom-progress-marker"
              role={isActionable ? 'button' : undefined}
              tabIndex={isActionable ? 0 : -1}
              aria-label={isActionable ? `Jump to ${marker.label}` : undefined}
              onKeyDown={
                isActionable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onMarkerClick?.(marker);
                      }
                    }
                  : undefined
              }
              style={{
                left: `${markerPosition}%`,
                backgroundColor: marker.color || '#fbbf24',
              }}
            />
          );
        })}

        {/* Progress handle */}
        <div className="custom-progress-handle" style={{ left: `${progress}%` }} />
      </div>
    </div>
  );
}
