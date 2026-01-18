/**
 * Blur radius calculation algorithms
 * Implements adaptive blur based on text size and media dimensions
 */

import { DEFAULTS, MEDIA_SELECTORS, TEXT_NODE_XPATH } from './constants';
import type { BlurManagerOptions, ElementAnalysis } from './types';

/**
 * Calculate blur radius for an element
 */
export function calculateBlurRadius(element: Element, options: BlurManagerOptions = {}): number {
  return analyzeElement(element, options).blurRadius;
}

/**
 * Analyze element and return detailed blur calculation
 */
export function analyzeElement(
  element: Element,
  options: BlurManagerOptions = {}
): ElementAnalysis {
  const textBlur = analyzeTextSize(element, options);
  const mediaBlur = analyzeMediaDimensions(element, options);

  // Take maximum of text and media blur
  const calculatedBlur = Math.max(textBlur, mediaBlur);

  // Apply min/max constraints
  const minBlur = options.minBlurRadius ?? DEFAULTS.MIN_BLUR_RADIUS;
  const maxBlur = options.maxBlurRadius ?? DEFAULTS.MAX_BLUR_RADIUS;
  const finalBlur = Math.max(minBlur, Math.min(maxBlur, calculatedBlur));

  return {
    blurRadius: finalBlur,
    textBlur,
    mediaBlur,
    maxFontSize: 0, // Will be set by analyzeTextSize
    maxMediaDimension: 0, // Will be set by analyzeMediaDimensions
    maxMediaArea: 0, // Will be set by analyzeMediaDimensions
  };
}

/**
 * Analyze text size and calculate blur radius
 *
 * Algorithm:
 * 1. Find all text nodes using XPath
 * 2. Get computed font size of parent elements
 * 3. Calculate blur = max(MIN, ceil(maxFontSize / divisor))
 */
export function analyzeTextSize(element: Element, options: BlurManagerOptions = {}): number {
  const divisor = options.textBlurDivisor ?? DEFAULTS.TEXT_BLUR_DIVISOR;
  const minBlur = options.minBlurRadius ?? DEFAULTS.MIN_BLUR_RADIUS;

  try {
    let maxFontSize = 0;

    // Try XPath first (most efficient)
    if (typeof document.evaluate !== 'undefined') {
      const xpathResult = document.evaluate(
        TEXT_NODE_XPATH,
        element,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );

      for (let i = 0; i < xpathResult.snapshotLength; i++) {
        const textNode = xpathResult.snapshotItem(i);
        const parentElement = textNode?.parentElement;

        if (parentElement) {
          const computedStyle = window.getComputedStyle(parentElement);
          const fontSize = parseFloat(computedStyle.fontSize);

          if (!isNaN(fontSize)) {
            maxFontSize = Math.max(maxFontSize, fontSize);
          }
        }
      }
    } else {
      // Fallback: TreeWalker for environments without XPath
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });

      let node;
      while ((node = walker.nextNode())) {
        const parentElement = node.parentElement;
        if (parentElement) {
          const computedStyle = window.getComputedStyle(parentElement);
          const fontSize = parseFloat(computedStyle.fontSize);

          if (!isNaN(fontSize)) {
            maxFontSize = Math.max(maxFontSize, fontSize);
          }
        }
      }
    }

    return Math.max(minBlur, Math.ceil(maxFontSize / divisor));
  } catch (error) {
    console.warn('Failed to analyze text size:', error);
    return minBlur;
  }
}

/**
 * Analyze media dimensions and calculate blur radius
 *
 * Algorithm:
 * 1. Find all media elements (img, svg, video, canvas, iframe)
 * 2. Get dimensions (width, height, area)
 * 3. Calculate blur using two formulas:
 *    - Dimension-based: max(width, height) / dimensionDivisor
 *    - Area-based: sqrt(width * height) / areaDivisor
 * 4. Return max of both
 */
export function analyzeMediaDimensions(element: Element, options: BlurManagerOptions = {}): number {
  const dimensionDivisor = options.mediaDimensionDivisor ?? DEFAULTS.MEDIA_DIMENSION_DIVISOR;
  const areaDivisor = options.mediaAreaDivisor ?? DEFAULTS.MEDIA_AREA_DIVISOR;
  const minBlur = options.minBlurRadius ?? DEFAULTS.MIN_BLUR_RADIUS;

  try {
    const mediaElements = element.querySelectorAll(MEDIA_SELECTORS);

    let maxDimension = 0;
    let maxArea = 0;

    mediaElements.forEach((media) => {
      const htmlElement = media as HTMLElement;
      const imgElement = media as HTMLImageElement;
      const videoElement = media as HTMLVideoElement;
      const canvasElement = media as HTMLCanvasElement;

      const width =
        htmlElement.offsetWidth ||
        imgElement.width ||
        videoElement.videoWidth ||
        canvasElement.width ||
        0;

      const height =
        htmlElement.offsetHeight ||
        imgElement.height ||
        videoElement.videoHeight ||
        canvasElement.height ||
        0;

      maxDimension = Math.max(maxDimension, width, height);
      maxArea = Math.max(maxArea, width * height);
    });

    const dimensionBlur = Math.ceil(maxDimension / dimensionDivisor);
    const areaBlur = Math.ceil(Math.sqrt(maxArea) / areaDivisor);

    return Math.max(minBlur, dimensionBlur, areaBlur);
  } catch (error) {
    console.warn('Failed to analyze media dimensions:', error);
    return minBlur;
  }
}

/**
 * Calculate blur radius for specific content type
 */
export function calculateBlurForContentType(
  contentType: 'text' | 'image' | 'video' | 'mixed',
  size: number,
  options: BlurManagerOptions = {}
): number {
  const minBlur = options.minBlurRadius ?? DEFAULTS.MIN_BLUR_RADIUS;

  switch (contentType) {
    case 'text': {
      const divisor = options.textBlurDivisor ?? DEFAULTS.TEXT_BLUR_DIVISOR;
      return Math.max(minBlur, Math.ceil(size / divisor));
    }
    case 'image':
    case 'video': {
      const divisor = options.mediaDimensionDivisor ?? DEFAULTS.MEDIA_DIMENSION_DIVISOR;
      return Math.max(minBlur, Math.ceil(size / divisor));
    }
    case 'mixed': {
      // Use average of text and media divisors
      const textDivisor = options.textBlurDivisor ?? DEFAULTS.TEXT_BLUR_DIVISOR;
      const mediaDivisor = options.mediaDimensionDivisor ?? DEFAULTS.MEDIA_DIMENSION_DIVISOR;
      const avgDivisor = (textDivisor + mediaDivisor) / 2;
      return Math.max(minBlur, Math.ceil(size / avgDivisor));
    }
    default:
      return minBlur;
  }
}

/**
 * Determine if element is in viewport
 * Used for IntersectionObserver optimization
 */
export function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();

  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

/**
 * Get element dimensions
 */
export function getElementDimensions(element: Element): {
  width: number;
  height: number;
  area: number;
} {
  const htmlElement = element as HTMLElement;
  const width = htmlElement.offsetWidth || 0;
  const height = htmlElement.offsetHeight || 0;

  return {
    width,
    height,
    area: width * height,
  };
}
