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
  BlurManagerEvent,
  BlurManagerEventListener,
  BlurManagerOptions,
  BlurState,
  ElementAnalysis,
  Logger,
  MutationBatch,
  PerformanceMetrics,
  SelectorSource,
  SelectorType,
} from './types';

// Constants
export {
  CUSTOM_SELECTOR_META_NAME,
  DATA_ATTRIBUTE_PREFIX,
  DEFAULTS,
  MEDIA_SELECTORS,
  MUTATION_OBSERVER_CONFIG,
  PERFORMANCE_MARKS,
  TEXT_NODE_XPATH,
} from './constants';

// Selectors
export {
  getMaskSelectorsString,
  getSelectorStats,
  getUnmaskSelectorsString,
  MASK_SELECTORS,
  readCustomSelectorsFromMeta,
  UNMASK_SELECTORS,
} from './selectors';

// Calculator
export {
  analyzeElement,
  analyzeMediaDimensions,
  analyzeTextSize,
  calculateBlurForContentType,
  calculateBlurRadius,
  getElementDimensions,
  isInViewport,
} from './calculator';

// State management
export {
  applyBlurFilter,
  clearBlurState,
  extractBlurRadius,
  findAllBlurredElements,
  getBlurStats,
  getCurrentFilter,
  hasBlurState,
  isElementBlurred,
  loadBlurState,
  removeBlurFilter,
  restoreOriginalFilter,
  saveBlurState,
} from './state';

// Observer utilities
export {
  createBatchedObserver,
  createIntersectionObserver,
  debounce,
  disconnect,
  observe,
  processMutationBatch,
  throttle,
} from './observer';

// Utils
export {
  checkBrowserSupport,
  createLogger,
  createUniqueId,
  deepClone,
  getAttributeValue,
  isBrowser,
  isElementVisible,
  matchesSelector,
  measurePerformance,
  measurePerformanceAsync,
  merge,
  parseBoolean,
  querySelectorAllSafe,
} from './utils';

// Version
export const VERSION = '1.0.0';
