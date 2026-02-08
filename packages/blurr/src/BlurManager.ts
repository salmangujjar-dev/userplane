/**
 * BlurManager - Main class for managing privacy blur
 */

import { calculateBlurRadius, isInViewport } from './calculator';
import { CUSTOM_SELECTOR_META_NAME, DEFAULTS } from './constants';
import { createBatchedObserver, createIntersectionObserver, disconnect, observe } from './observer';
import {
  getMaskSelectorsString,
  getUnmaskSelectorsString,
  readCustomSelectorsFromMeta,
} from './selectors';
import {
  applyBlurFilter,
  findAllBlurredElements,
  hasBlurState,
  restoreOriginalFilter,
  saveBlurState,
} from './state';
import type {
  BlurManagerEvent,
  BlurManagerEventListener,
  BlurManagerOptions,
  Logger,
  MutationBatch,
  PerformanceMetrics,
} from './types';
import {
  checkBrowserSupport,
  createLogger,
  isElementVisible,
  matchesSelector,
  measurePerformance,
  querySelectorAllSafe,
} from './utils';

/**
 * BlurManager class
 *
 * Manages privacy blur for screen recording and session replay
 */
export class BlurManager {
  // Core state
  private _customSelectors: string[];
  private _didBlurElements = false;
  private _isStarted = false;

  // Options
  private options: BlurManagerOptions;
  private logger: Logger;

  // Observers
  private mutationObserver: MutationObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  // Cached selectors
  private cachedMaskSelectors: string;
  private cachedUnmaskSelectors: string;

  // Event listeners
  private eventListeners = new Map<BlurManagerEvent, Set<BlurManagerEventListener>>();

  // Performance tracking
  private metrics: PerformanceMetrics = {
    startTime: 0,
    elementsBlurred: 0,
    mutationsProcessed: 0,
    avgMutationTime: 0,
    blurCalculations: 0,
    avgCalculationTime: 0,
  };

  /**
   * Create a new BlurManager instance
   */
  constructor(customSelectors: string[] = [], options: BlurManagerOptions = {}) {
    // Check browser support
    const support = checkBrowserSupport();
    if (!support.supported) {
      throw new Error(`BlurManager not supported: missing ${support.missing.join(', ')}`);
    }

    // Store options
    this.options = {
      ...DEFAULTS,
      ...options,
    };

    // Create logger
    this.logger = options.logger || createLogger('BlurManager');

    // Store custom selectors
    this._customSelectors = customSelectors;

    // Cache selectors
    this.cachedMaskSelectors = getMaskSelectorsString(customSelectors);
    this.cachedUnmaskSelectors = getUnmaskSelectorsString();

    this.logger.info(
      {
        customSelectors: customSelectors.length,
      },
      'BlurManager initialized'
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════

  /**
   * Start blurring
   */
  start(): void {
    if (this._isStarted) {
      this.logger.warn('Already started');
      return;
    }

    this.logger.info('Starting...');

    const { duration } = measurePerformance('blur-start', () => {
      // Find and blur all matching elements
      this._blurInitialElements();

      // Set up mutation observer
      this._setupMutationObserver();

      // Set up intersection observer (if enabled)
      if (this.options.useIntersectionObserver) {
        this._setupIntersectionObserver();
      }
    });

    this._isStarted = true;
    this.metrics.startTime = duration;

    this.logger.info(
      {
        duration: `${duration.toFixed(2)}ms`,
        elementsBlurred: this.metrics.elementsBlurred,
      },
      'Started successfully'
    );

    this.emit('start');
  }

  /**
   * Stop blurring and restore all elements
   */
  stop(): void {
    if (!this._isStarted) {
      this.logger.warn('Not started');
      return;
    }

    this.logger.info('Stopping...');

    measurePerformance('blur-stop', () => {
      // Disconnect observers
      if (this.mutationObserver) {
        disconnect(this.mutationObserver);
        this.mutationObserver = null;
      }

      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }

      // Restore all blurred elements
      this._restoreAllElements();
    });

    this._isStarted = false;

    this.logger.info('Stopped successfully');

    this.emit('stop');
  }

  /**
   * Manually blur a specific element
   */
  blurElement(element: Element): boolean {
    if (!this._isStarted) {
      this.logger.warn('Not started - cannot blur element');
      return false;
    }

    if (this._shouldUnmask(element)) {
      this.logger.debug('Element should not be blurred (unmask)');
      return false;
    }

    if (hasBlurState(element)) {
      this.logger.debug('Element already blurred');
      return false;
    }

    this._applyBlur(element);
    return true;
  }

  /**
   * Manually unblur a specific element
   */
  unblurElement(element: Element): boolean {
    if (!hasBlurState(element)) {
      this.logger.debug('Element not blurred');
      return false;
    }

    restoreOriginalFilter(element);
    this.emit('unblur', { element });

    return true;
  }

  /**
   * Check if any elements were blurred
   */
  get didBlurElements(): boolean {
    return this._didBlurElements;
  }

  /**
   * Get custom selectors
   */
  get customSelectors(): string[] {
    return [...this._customSelectors];
  }

  /**
   * Get performance metrics
   */
  get performanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current state
   */
  get isStarted(): boolean {
    return this._isStarted;
  }

  /**
   * Clear blur tracking data
   */
  clearData(): void {
    this._didBlurElements = false;
    this.metrics = {
      startTime: 0,
      elementsBlurred: 0,
      mutationsProcessed: 0,
      avgMutationTime: 0,
      blurCalculations: 0,
      avgCalculationTime: 0,
    };
  }

  /**
   * Add custom selectors dynamically
   */
  addCustomSelectors(selectors: string[]): void {
    this._customSelectors.push(...selectors);

    // Rebuild cached selectors
    this.cachedMaskSelectors = getMaskSelectorsString(this._customSelectors);

    this.logger.info({ selectors }, 'Added custom selectors');

    // Re-scan if already started
    if (this._isStarted) {
      this._blurInitialElements();
    }
  }

  /**
   * Remove custom selectors
   */
  removeCustomSelectors(selectors: string[]): void {
    this._customSelectors = this._customSelectors.filter((s) => !selectors.includes(s));

    // Rebuild cached selectors
    this.cachedMaskSelectors = getMaskSelectorsString(this._customSelectors);

    this.logger.info({ selectors }, 'Removed custom selectors');
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════

  /**
   * Add event listener
   */
  on(event: BlurManagerEvent, listener: BlurManagerEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: BlurManagerEvent, listener: BlurManagerEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event
   */
  private emit(event: BlurManagerEvent, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          this.logger.error({ err: error }, 'Error in event listener');
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Blur all initial elements
   */
  private _blurInitialElements(): void {
    const elements = querySelectorAllSafe(document, this.cachedMaskSelectors);

    this.logger.info(`Found ${elements.length} elements to blur`);

    elements.forEach((element) => {
      this._applyBlur(element);
    });
  }

  /**
   * Apply blur to an element
   */
  private _applyBlur(element: Element): void {
    // Skip if already blurred
    if (hasBlurState(element)) {
      return;
    }

    // Check if should unmask
    if (this._shouldUnmask(element)) {
      return;
    }

    // Skip if not visible (optimization) - only in real browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).happyDOM === undefined) {
      if (!isElementVisible(element)) {
        return;
      }
    }

    // Calculate blur radius
    const { result: blurRadius, duration } = measurePerformance('calculate-blur', () =>
      calculateBlurRadius(element, this.options)
    );

    this.metrics.blurCalculations++;
    this.metrics.avgCalculationTime =
      (this.metrics.avgCalculationTime * (this.metrics.blurCalculations - 1) + duration) /
      this.metrics.blurCalculations;

    // Get original filter
    const htmlElement = element as HTMLElement;
    const originalFilter = htmlElement.style.filter || '';

    // Save state
    saveBlurState(element, {
      originalFilter,
      blurRadius,
      timestamp: Date.now(),
    });

    // Apply blur filter
    applyBlurFilter(element, blurRadius);

    // Track metrics
    this.metrics.elementsBlurred++;
    this._didBlurElements = true;

    this.logger.debug({ blurRadius }, 'Blurred element');

    this.emit('blur', { element, blurRadius });
  }

  /**
   * Check if element should be unmasked
   */
  private _shouldUnmask(element: Element): boolean {
    // Check unmask selectors
    if (matchesSelector(element, this.cachedUnmaskSelectors)) {
      return true;
    }

    // Check data-userplane-blur attribute
    const htmlElement = element as HTMLElement;
    const blurAttr = htmlElement.dataset.userplaneBlur;

    if (blurAttr === 'false' || blurAttr === '0' || blurAttr === 'no') {
      return true;
    }

    return false;
  }

  /**
   * Restore all blurred elements
   */
  private _restoreAllElements(): void {
    const elements = findAllBlurredElements();

    this.logger.info(`Restoring ${elements.length} elements`);

    elements.forEach((element) => {
      restoreOriginalFilter(element);
    });
  }

  /**
   * Set up mutation observer
   */
  private _setupMutationObserver(): void {
    const useRAF = this.options.useRAFBatching ?? DEFAULTS.USE_RAF_BATCHING;

    this.mutationObserver = createBatchedObserver(
      (batch) => this._handleMutationBatch(batch),
      useRAF
    );

    observe(this.mutationObserver, document.documentElement);

    this.logger.info({ useRAF }, 'MutationObserver started');
  }

  /**
   * Handle mutation batch
   */
  private _handleMutationBatch(batch: MutationBatch): void {
    // Skip empty batches
    if (batch.elementsToBlur.size === 0 && batch.elementsToReevaluate.size === 0) {
      return;
    }

    this.logger.debug(
      {
        toBlur: batch.elementsToBlur.size,
        toReevaluate: batch.elementsToReevaluate.size,
      },
      'Processing mutation batch'
    );

    const { duration } = measurePerformance('handle-mutations', () => {
      // Process elements to blur
      batch.elementsToBlur.forEach((element) => {
        if (matchesSelector(element, this.cachedMaskSelectors)) {
          this._applyBlur(element);
        }
      });

      // Process elements to re-evaluate
      batch.elementsToReevaluate.forEach((element) => {
        if (hasBlurState(element)) {
          if (this._shouldUnmask(element)) {
            restoreOriginalFilter(element);
          }
        } else {
          if (matchesSelector(element, this.cachedMaskSelectors)) {
            this._applyBlur(element);
          }
        }
      });
    });

    this.metrics.mutationsProcessed++;
    this.metrics.avgMutationTime =
      (this.metrics.avgMutationTime * (this.metrics.mutationsProcessed - 1) + duration) /
      this.metrics.mutationsProcessed;

    this.emit('mutation', { batch, duration });
  }

  /**
   * Set up intersection observer (for lazy blurring)
   */
  private _setupIntersectionObserver(): void {
    this.intersectionObserver = createIntersectionObserver((element, isIntersecting) => {
      if (isIntersecting) {
        // Element entered viewport - blur if needed
        if (matchesSelector(element, this.cachedMaskSelectors) && !hasBlurState(element)) {
          this._applyBlur(element);
        }
      }
    });

    // Observe all matching elements that are offscreen
    const elements = querySelectorAllSafe(document, this.cachedMaskSelectors);

    elements.forEach((element) => {
      if (!isInViewport(element)) {
        this.intersectionObserver!.observe(element);
      }
    });

    this.logger.info('IntersectionObserver started');
  }

  // ═══════════════════════════════════════════════════════════
  // STATIC METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Create BlurManager from meta tags
   */
  static fromMetaTags(
    metaName = CUSTOM_SELECTOR_META_NAME,
    options: BlurManagerOptions = {}
  ): BlurManager {
    const customSelectors = readCustomSelectorsFromMeta(metaName);
    return new BlurManager(customSelectors, options);
  }

  /**
   * Check if browser is supported
   */
  static checkSupport(): ReturnType<typeof checkBrowserSupport> {
    return checkBrowserSupport();
  }
}
