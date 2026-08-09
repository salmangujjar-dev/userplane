'use client';

import React, { useCallback, useState } from 'react';

import type { QualityLevel } from '../hooks/useVideoPlayer';
import { ControlDropdown } from './ControlDropdown';

interface QualityControlProps {
  /** Available quality levels */
  qualities: QualityLevel[];
  /** Current quality label (e.g., "Auto", "1080p") */
  currentQuality: string;
  /** Callback when quality is selected */
  onQualitySelect: (height: number | 'auto') => void;
  /** Callback when another dropdown opens */
  onOpenChange?: (isOpen: boolean) => void;
  /** Whether this dropdown should be closed (controlled by parent) */
  forceClose?: boolean;
}

type QualityValue = number | 'auto';

/**
 * Quality selector dropdown for inline control bar
 */
export function QualityControl({
  qualities,
  currentQuality,
  onQualitySelect,
  onOpenChange,
  forceClose = false,
}: QualityControlProps) {
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
    (value: QualityValue) => {
      onQualitySelect(value);
      setIsOpen(false);
      onOpenChange?.(false);
    },
    [onQualitySelect, onOpenChange]
  );

  // Build options list
  const options: { value: QualityValue; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    ...qualities.map((q) => ({
      value: q.height,
      label: `${q.height}p`,
    })),
  ];

  // Get current value for comparison
  const currentValue: QualityValue =
    currentQuality === 'Auto' ? 'auto' : parseInt(currentQuality.replace('p', ''), 10);

  if (qualities.length === 0) {
    return null;
  }

  return (
    <ControlDropdown<QualityValue>
      currentValue={currentValue}
      options={options}
      isOpen={isOpen}
      onToggle={handleToggle}
      onSelect={handleSelect}
      buttonLabel={currentQuality}
      ariaLabel={`Video quality: ${currentQuality}`}
      title={`Quality: ${currentQuality}`}
      labelClassName="custom-quality-button custom-quality-label"
    />
  );
}
