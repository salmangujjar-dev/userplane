/**
 * Blurr - Production-grade privacy blur system
 * for screen recording and session replay
 *
 * @packageDocumentation
 */

// Main class
export { BlurManager } from './BlurManager';

// Types
export type {
  Logger,
  BlurManagerOptions,
  BlurState,
  ElementAnalysis,
  MutationBatch,
  PerformanceMetrics,
  BlurManagerEvent,
  BlurManagerEventListener,
  SelectorType,
  SelectorSource,
} from './types';

// Constants
export {
  DEFAULTS,
  TEXT_NODE_XPATH,
  MEDIA_SELECTORS,
  CUSTOM_SELECTOR_META_NAME,
  DATA_ATTRIBUTE_PREFIX,
  MUTATION_OBSERVER_CONFIG,
  PERFORMANCE_MARKS,
} from './constants';

// Selectors
export {
  UNMASK_SELECTORS,
  MASK_SELECTORS,
  getMaskSelectorsString,
  getUnmaskSelectorsString,
  readCustomSelectorsFromMeta,
  getSelectorStats,
} from './selectors';

// Calculator
export {
  calculateBlurRadius,
  analyzeElement,
  analyzeTextSize,
  analyzeMediaDimensions,
  calculateBlurForContentType,
  isInViewport,
  getElementDimensions,
} from './calculator';

// State management
export {
  saveBlurState,
  loadBlurState,
  hasBlurState,
  clearBlurState,
  applyBlurFilter,
  removeBlurFilter,
  restoreOriginalFilter,
  getCurrentFilter,
  isElementBlurred,
  extractBlurRadius,
  findAllBlurredElements,
  getBlurStats,
} from './state';

// Observer utilities
export {
  createBatchedObserver,
  processMutationBatch,
  observe,
  disconnect,
  createIntersectionObserver,
  debounce,
  throttle,
} from './observer';

// Utils
export {
  createLogger,
  isBrowser,
  checkBrowserSupport,
  matchesSelector,
  querySelectorAllSafe,
  isElementVisible,
  getAttributeValue,
  parseBoolean,
  measurePerformance,
  measurePerformanceAsync,
  createUniqueId,
  deepClone,
  merge,
} from './utils';

// Version
export const VERSION = '1.0.0';
