'use client';

import React, { useCallback, useState } from 'react';

import { ControlDropdown } from './ControlDropdown';

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: 'Normal' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

interface SpeedControlProps {
  /** Current playback speed */
  playbackSpeed: number;
  /** Callback when speed is selected */
  onSpeedSelect: (speed: number) => void;
  /** Callback when dropdown opens/closes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Whether this dropdown should be closed (controlled by parent) */
  forceClose?: boolean;
}

/**
 * Speed selector dropdown for inline control bar
 */
export function SpeedControl({
  playbackSpeed,
  onSpeedSelect,
  onOpenChange,
  forceClose = false,
}: SpeedControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close when forceClose changes to true
  const [prevForceClose, setPrevForceClose] = React.useState(forceClose);
  if (prevForceClose !== forceClose) {
    setPrevForceClose(forceClose);
    if (forceClose && isOpen) {
      setIsOpen(false);
    }
  }

  const handleToggle = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  }, [isOpen, onOpenChange]);

  const handleSelect = useCallback(
    (value: number) => {
      onSpeedSelect(value);
      setIsOpen(false);
      onOpenChange?.(false);
    },
    [onSpeedSelect, onOpenChange]
  );

  const buttonLabel = playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`;

  return (
    <ControlDropdown<number>
      currentValue={playbackSpeed}
      options={SPEED_OPTIONS}
      isOpen={isOpen}
      onToggle={handleToggle}
      onSelect={handleSelect}
      buttonLabel={`${playbackSpeed}x`}
      ariaLabel={`Playback speed: ${buttonLabel}`}
      title={`Speed: ${buttonLabel}`}
      labelClassName="custom-speed-button custom-speed-label"
    />
  );
}
