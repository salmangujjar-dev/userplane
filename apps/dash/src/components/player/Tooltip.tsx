'use client';

import React from 'react';
import './Tooltip.css';

interface ActiveMarker {
  time: number;
  label: string;
  color?: string;
  index: number;
  element: HTMLElement;
}

interface TooltipProps {
  marker: ActiveMarker | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const Tooltip: React.FC<TooltipProps> = ({ marker, containerRef }) => {
  if (!marker) return null;

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate tooltip position based on marker element
  const getTooltipPosition = (): React.CSSProperties => {
    if (!marker?.element) return {};

    const markerRect = marker.element.getBoundingClientRect();
    const containerRect = containerRef?.current?.getBoundingClientRect();

    if (!containerRect) return {};

    const left = markerRect.left - containerRect.left + markerRect.width / 2;

    return { left: `${left}px` };
  };

  return (
    <div className="vjs-marker-tooltip" style={getTooltipPosition()}>
      <div className="vjs-marker-tooltip-time" style={marker.color ? { color: marker.color } : {}}>
        {formatTime(marker.time)}
      </div>
      <div className="vjs-marker-tooltip-label">{marker.label}</div>
    </div>
  );
};

export default Tooltip;
