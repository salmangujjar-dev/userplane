/**
 * Type definitions for Blurr
 */

/**
 * Logger interface — re-exported from @workspace/console-logger
 */
import type { Logger } from '@workspace/console-logger';
export type { Logger };

/**
 * Options for BlurManager constructor
 */
export interface BlurManagerOptions {
  /**
   * Custom logger instance (defaults to console)
   */
  logger?: Logger;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Minimum blur radius in pixels
   */
  minBlurRadius?: number;

  /**
   * Maximum blur radius in pixels
   */
  maxBlurRadius?: number;

  /**
   * Text blur divisor (larger = less blur)
   * Default: 4 (fontSize / 4)
   */
  textBlurDivisor?: number;

  /**
   * Media dimension divisor
   * Default: 30 (dimension / 30)
   */
  mediaDimensionDivisor?: number;

  /**
   * Media area divisor
   * Default: 28 (sqrt(area) / 28)
   */
  mediaAreaDivisor?: number;

  /**
   * Use IntersectionObserver for offscreen elements (performance optimization)
   */
  useIntersectionObserver?: boolean;

  /**
   * Use requestAnimationFrame for batching (performance optimization)
   */
  useRAFBatching?: boolean;
}

/**
 * Blur state for tracking
 */
export interface BlurState {
  /**
   * Original filter value
   */
  originalFilter: string;

  /**
   * Applied blur radius
   */
  blurRadius: number;

  /**
   * Timestamp when blur was applied
   */
  timestamp: number;
}

/**
 * Element analysis result
 */
export interface ElementAnalysis {
  /**
   * Calculated blur radius
   */
  blurRadius: number;

  /**
   * Text-based blur component
   */
  textBlur: number;

  /**
   * Media-based blur component
   */
  mediaBlur: number;

  /**
   * Max font size found
   */
  maxFontSize: number;

  /**
   * Max media dimension found
   */
  maxMediaDimension: number;

  /**
   * Max media area found
   */
  maxMediaArea: number;
}

/**
 * Mutation batch result
 */
export interface MutationBatch {
  /**
   * Elements to blur
   */
  elementsToBlur: Set<Element>;

  /**
   * Elements to unblur
   */
  elementsToUnblur: Set<Element>;

  /**
   * Elements to re-evaluate
   */
  elementsToReevaluate: Set<Element>;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /**
   * Time taken to start (ms)
   */
  startTime: number;

  /**
   * Number of elements blurred
   */
  elementsBlurred: number;

  /**
   * Number of mutations processed
   */
  mutationsProcessed: number;

  /**
   * Average mutation processing time (ms)
   */
  avgMutationTime: number;

  /**
   * Total blur calculations
   */
  blurCalculations: number;

  /**
   * Average calculation time (ms)
   */
  avgCalculationTime: number;
}

/**
 * Event types emitted by BlurManager
 */
export type BlurManagerEvent = 'start' | 'stop' | 'blur' | 'unblur' | 'mutation' | 'error';

/**
 * Event listener type
 */
export type BlurManagerEventListener = (data?: unknown) => void;

/**
 * Data attribute keys
 */
export const DATA_ATTRIBUTES = {
  /**
   * Stores original filter value
   */
  RESTORE: '__userplaneRestore',

  /**
   * Stores blur radius
   */
  RADIUS: '__userplaneRadius',

  /**
   * Stores timestamp
   */
  TIMESTAMP: '__userplaneTimestamp',
} as const;

/**
 * Data attribute names for CSS selectors (kebab-case format matching HTML attributes)
 */
export const DATA_ATTR_SELECTORS = {
  RESTORE: '__userplane-restore',
  RADIUS: '__userplane-radius',
  TIMESTAMP: '__userplane-timestamp',
} as const;

/**
 * Selector types
 */
export type SelectorType = 'mask' | 'unmask' | 'custom';

/**
 * Selector source
 */
export interface SelectorSource {
  type: SelectorType;
  selector: string;
  provider?: string;
  description?: string;
}
