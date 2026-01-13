/**
 * State management for blur tracking and restoration
 */

import { DATA_ATTRIBUTES, DATA_ATTR_SELECTORS } from './types';
import type { BlurState } from './types';

/**
 * Save blur state to element
 * @param element - The element to save the blur state to
 * @param state - The blur state to save
 * Some elements may have existing blur state, so we need to save the original filter value.
 * We also need to save the timestamp when the blur state was saved.
 * This is useful for restoring the original filter value when the blur state is removed.
 * Before:
 * <img
 * style="filter: grayscale(100%)"
 * />
 * After:
 * <img
 * style="filter: grayscale(100%) blur(10px)" // This is the new blur state
 * data-userplane-restore="grayscale(100%)" // This is the original filter value
 * data-userplane-radius="10" // This is the blur radius
 * data-userplane-timestamp="1715769600000" // This is the timestamp when the blur state was saved
 * />
 */
export function saveBlurState(element: Element, state: BlurState): void {
  const htmlElement = element as HTMLElement;
  htmlElement.dataset[DATA_ATTRIBUTES.RESTORE] = state.originalFilter;
  htmlElement.dataset[DATA_ATTRIBUTES.RADIUS] = String(state.blurRadius);
  htmlElement.dataset[DATA_ATTRIBUTES.TIMESTAMP] = String(state.timestamp);
}

/**
 * Load blur state from element
 */
export function loadBlurState(element: Element): BlurState | null {
  const htmlElement = element as HTMLElement;
  const originalFilter = htmlElement.dataset[DATA_ATTRIBUTES.RESTORE];
  const blurRadius = htmlElement.dataset[DATA_ATTRIBUTES.RADIUS];
  const timestamp = htmlElement.dataset[DATA_ATTRIBUTES.TIMESTAMP];

  if (originalFilter === undefined) {
    return null;
  }

  return {
    originalFilter,
    blurRadius: blurRadius ? parseFloat(blurRadius) : 0,
    timestamp: timestamp ? parseFloat(timestamp) : 0,
  };
}

/**
 * Check if element has blur state
 */
export function hasBlurState(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  return htmlElement.dataset[DATA_ATTRIBUTES.RESTORE] !== undefined;
}

/**
 * Clear blur state from element
 */
export function clearBlurState(element: Element): void {
  const htmlElement = element as HTMLElement;
  delete htmlElement.dataset[DATA_ATTRIBUTES.RESTORE];
  delete htmlElement.dataset[DATA_ATTRIBUTES.RADIUS];
  delete htmlElement.dataset[DATA_ATTRIBUTES.TIMESTAMP];
}

/**
 * Apply blur filter to element
 */
export function applyBlurFilter(element: Element, blurRadius: number): void {
  const htmlElement = element as HTMLElement;
  const existingFilter = htmlElement.style.filter || '';
  const blurFilter = `blur(${blurRadius}px)`;

  if (existingFilter.trim()) {
    if (existingFilter.includes('blur(')) {
      htmlElement.style.filter = existingFilter.replace(/blur\([^)]+\)/, blurFilter);
    } else {
      htmlElement.style.filter = `${existingFilter} ${blurFilter}`;
    }
  } else {
    htmlElement.style.filter = blurFilter;
  }
}

/**
 * Remove blur filter from element
 */
export function removeBlurFilter(element: Element): void {
  const htmlElement = element as HTMLElement;
  const existingFilter = htmlElement.style.filter || '';

  if (existingFilter.includes('blur(')) {
    htmlElement.style.filter = existingFilter.replace(/blur\([^)]+\)\s*/g, '').trim();
  }
}

/**
 * Restore original filter
 */
export function restoreOriginalFilter(element: Element): void {
  const state = loadBlurState(element);

  if (state) {
    const htmlElement = element as HTMLElement;
    htmlElement.style.filter = state.originalFilter;
    clearBlurState(element);
  }
}

/**
 * Get current filter value
 */
export function getCurrentFilter(element: Element): string {
  const htmlElement = element as HTMLElement;
  return htmlElement.style.filter || '';
}

/**
 * Check if element is currently blurred
 */
export function isElementBlurred(element: Element): boolean {
  const filter = getCurrentFilter(element);
  return filter.includes('blur(');
}

/**
 * Extract blur radius from filter string
 */
export function extractBlurRadius(filter: string): number | null {
  const match = filter.match(/blur\((\d+(?:\.\d+)?)px\)/);
  return match && match[1] ? parseFloat(match[1]) : null;
}

/**
 * Find all blurred elements in document
 */
export function findAllBlurredElements(): Element[] {
  const selector = `[data-${DATA_ATTR_SELECTORS.RESTORE}]`;
  return Array.from(document.querySelectorAll(selector));
}

/**
 * Get blur statistics
 */
export function getBlurStats(): {
  totalBlurred: number;
  avgBlurRadius: number;
  minBlurRadius: number;
  maxBlurRadius: number;
} {
  const blurredElements = findAllBlurredElements();

  if (blurredElements.length === 0) {
    return {
      totalBlurred: 0,
      avgBlurRadius: 0,
      minBlurRadius: 0,
      maxBlurRadius: 0,
    };
  }

  const radii = blurredElements
    .map((el) => loadBlurState(el)?.blurRadius ?? 0)
    .filter((r) => r > 0);

  const sum = radii.reduce((acc, r) => acc + r, 0);
  const avg = sum / radii.length;
  const min = Math.min(...radii);
  const max = Math.max(...radii);

  return {
    totalBlurred: blurredElements.length,
    avgBlurRadius: avg,
    minBlurRadius: min,
    maxBlurRadius: max,
  };
}
