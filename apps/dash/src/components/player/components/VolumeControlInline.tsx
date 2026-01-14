'use client';

import React from 'react';
import { Volume2Icon, VolumeXIcon } from 'lucide-react';

interface VolumeControlInlineProps {
  /** Current volume level (0-1) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Callback when volume changes */
  onVolumeChange: (volume: number) => void;
  /** Callback to toggle mute */
  onToggleMute: () => void;
}

/**
 * Inline volume control with mute button and slider
 * Used in the player control bar (different from dropdown VolumeControl)
 */
export function VolumeControlInline({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlInlineProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  return (
    <div className="custom-volume-control">
      <button
        className="custom-control-button"
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        type="button"
      >
        {isMuted || volume === 0 ? (
          <VolumeXIcon className="w-5 h-5" />
        ) : (
          <Volume2Icon className="w-5 h-5" />
        )}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : volume}
        onChange={handleSliderChange}
        className="custom-volume-slider"
        aria-label="Volume"
      />
    </div>
  );
}
