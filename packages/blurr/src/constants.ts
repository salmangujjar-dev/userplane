/**
 * Constants used throughout Blurr
 */

/**
 * Default configuration values
 */
export const DEFAULTS = {
  /**
   * Minimum blur radius (px)
   */
  MIN_BLUR_RADIUS: 4,

  /**
   * Maximum blur radius (px)
   */
  MAX_BLUR_RADIUS: 100,

  /**
   * Text blur divisor
   * Formula: blur = fontSize / TEXT_BLUR_DIVISOR
   */
  TEXT_BLUR_DIVISOR: 4,

  /**
   * Media dimension divisor
   * Formula: blur = maxDimension / MEDIA_DIMENSION_DIVISOR
   */
  MEDIA_DIMENSION_DIVISOR: 30,

  /**
   * Media area divisor
   * Formula: blur = sqrt(area) / MEDIA_AREA_DIVISOR
   */
  MEDIA_AREA_DIVISOR: 28,

  /**
   * Use IntersectionObserver optimization
   */
  USE_INTERSECTION_OBSERVER: true,

  /**
   * Use requestAnimationFrame batching
   */
  USE_RAF_BATCHING: true,

  /**
   * Debug mode
   */
  DEBUG: false,
} as const;

/**
 * XPath query for finding text nodes
 */
export const TEXT_NODE_XPATH = './/text()[normalize-space()]';

/**
 * Media element selectors
 */
export const MEDIA_SELECTORS = 'img, svg, video, canvas, iframe';

/**
 * Meta tag name for custom selectors
 */
export const CUSTOM_SELECTOR_META_NAME = 'userplane:blur';

/**
 * Data attribute prefix
 */
export const DATA_ATTRIBUTE_PREFIX = '__userplane-';

/**
 * MutationObserver configuration
 */
export const MUTATION_OBSERVER_CONFIG: MutationObserverInit = {
  attributes: true,
  attributeFilter: ['data-userplane-blur', 'class', 'style'],
  childList: true,
  subtree: true,
};

/**
 * Performance mark names
 */
export const PERFORMANCE_MARKS = {
  START_BEGIN: 'blurr-start-begin',
  START_END: 'blurr-start-end',
  STOP_BEGIN: 'blurr-stop-begin',
  STOP_END: 'blurr-stop-end',
  BLUR_BEGIN: 'blurr-blur-begin',
  BLUR_END: 'blurr-blur-end',
  CALC_BEGIN: 'blurr-calc-begin',
  CALC_END: 'blurr-calc-end',
} as const;
