/**
 * MutationObserver handling for dynamic content
 * Includes performance optimizations (batching, RAF, deduplication)
 */

import { MUTATION_OBSERVER_CONFIG } from './constants';
import type { MutationBatch } from './types';

/**
 * Create a batched mutation observer
 *
 * Optimizations:
 * - Uses requestAnimationFrame for batching
 * - Deduplicates elements using Set
 * - Processes mutations in next frame
 */
export function createBatchedObserver(
  callback: (batch: MutationBatch) => void,
  useRAF = true
): MutationObserver {
  let pendingMutations: MutationRecord[] = [];
  let scheduled = false;

  const processMutations = () => {
    const batch = processMutationBatch(pendingMutations);
    callback(batch);

    // Clear pending
    pendingMutations = [];
    scheduled = false;
  };

  const observer = new MutationObserver((mutations) => {
    pendingMutations.push(...mutations);

    if (!scheduled) {
      scheduled = true;

      if (useRAF) {
        requestAnimationFrame(processMutations);
      } else {
        processMutations();
      }
    }
  });

  return observer;
}

/**
 * Process a batch of mutations
 */
export function processMutationBatch(mutations: MutationRecord[]): MutationBatch {
  const elementsToBlur = new Set<Element>();
  const elementsToUnblur = new Set<Element>();
  const elementsToReevaluate = new Set<Element>();

  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes') {
      elementsToReevaluate.add(mutation.target as Element);
    } else if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          collectElementsToBlur(node as Element, elementsToBlur);
        }
      });
    }
  });

  return {
    elementsToBlur,
    elementsToUnblur,
    elementsToReevaluate,
  };
}

/**
 * Collect element and its descendants that should be blurred
 */
function collectElementsToBlur(element: Element, collector: Set<Element>): void {
  collector.add(element);
  const children = element.querySelectorAll('*');
  children.forEach((child) => collector.add(child));
}

/**
 * Start observing an element
 */
export function observe(
  observer: MutationObserver,
  target: Node,
  config: MutationObserverInit = MUTATION_OBSERVER_CONFIG
): void {
  observer.observe(target, config);
}

/**
 * Stop observing
 */
export function disconnect(observer: MutationObserver): void {
  observer.disconnect();
}

/**
 * Create an IntersectionObserver for lazy blurring
 *
 * Only blur elements when they enter the viewport
 */
export function createIntersectionObserver(
  callback: (element: Element, isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      callback(entry.target, entry.isIntersecting);
    });
  }, options);

  return observer;
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
