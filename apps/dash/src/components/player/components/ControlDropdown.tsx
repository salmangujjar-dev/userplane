'use client';

import React, { useEffect, useRef } from 'react';

interface ControlDropdownItem<T> {
  value: T;
  label: string;
}

interface ControlDropdownProps<T> {
  /** Currently selected value */
  currentValue: T;
  /** Available options */
  options: ControlDropdownItem<T>[];
  /** Whether the menu is open */
  isOpen: boolean;
  /** Callback when menu should toggle */
  onToggle: () => void;
  /** Callback when an item is selected */
  onSelect: (value: T) => void;
  /** Label for the button (formatted current value) */
  buttonLabel: string;
  /** Accessible name for the button */
  ariaLabel: string;
  /** Tooltip title for the button */
  title: string;
  /** CSS class for the button label */
  labelClassName?: string;
  /** Compare function for values (defaults to ===) */
  compareValues?: (a: T, b: T) => boolean;
}

/**
 * Generic dropdown control for quality selector, speed selector, etc.
 * Provides consistent styling and behavior across all dropdowns.
 */
export function ControlDropdown<T>({
  currentValue,
  options,
  isOpen,
  onToggle,
  onSelect,
  buttonLabel,
  ariaLabel,
  title,
  labelClassName = '',
  compareValues = (a, b) => a === b,
}: ControlDropdownProps<T>) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="custom-dropdown-container" ref={menuRef}>
      <button
        className={`custom-control-button ${labelClassName}`}
        onClick={onToggle}
        aria-label={ariaLabel}
        type="button"
        title={title}
      >
        <span className={labelClassName}>{buttonLabel}</span>
      </button>
      {isOpen && (
        <div className="custom-dropdown-menu">
          {options.map((option) => {
            const isSelected = compareValues(currentValue, option.value);
            return (
              <button
                key={String(option.value)}
                className={`custom-dropdown-item ${isSelected ? 'active' : ''}`}
                onClick={() => onSelect(option.value)}
                type="button"
              >
                {option.label}
                {isSelected && <span className="custom-dropdown-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
