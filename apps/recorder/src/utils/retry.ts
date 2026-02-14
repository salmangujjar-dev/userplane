/**
 * Retry Utilities
 * Generic retry and timeout utilities with exponential backoff
 */

import { createLogger } from '@/lib/logger';
import { posthog } from '@/posthog/client';

const logger = createLogger('retry');

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseDelay?: number;
  /** Maximum delay between retries in ms (default: 30000 = 30 seconds) */
  maxDelay?: number;
  /** Backoff strategy: 'exponential' or 'linear' (default: 'exponential') */
  backoffStrategy?: 'exponential' | 'linear';
  /** Function to determine if error should trigger retry (default: retry all) */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Optional callback on each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  /** Timeout in milliseconds for the operation (optional) */
  timeout?: number;
  /** Total timeout across all retry attempts (circuit breaker, optional) */
  totalTimeout?: number;
}

export interface TimeoutOptions {
  /** Timeout in milliseconds */
  timeout: number;
  /** Error message for timeout (default: 'Operation timed out') */
  timeoutMessage?: string;
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffStrategy = 'exponential',
    shouldRetry = () => true,
    onRetry,
    timeout,
    totalTimeout,
  } = options;

  let lastError: Error | null = null;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if we've exceeded the total timeout across all attempts
      if (totalTimeout !== undefined) {
        const elapsed = Date.now() - startTime;
        if (elapsed >= totalTimeout) {
          throw new Error(`Total timeout exceeded: ${elapsed}ms elapsed, ${totalTimeout}ms limit`);
        }
      }

      // Apply timeout if specified
      if (timeout !== undefined) {
        return await withTimeout(fn, { timeout });
      }

      const result = await fn();
      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (!shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // If this was the last attempt, capture and throw
      if (attempt >= maxRetries) {
        posthog.captureException(lastError, {
          error_type: 'retry_exhausted',
          error_source: 'retry_util',
          max_retries: maxRetries,
          attempts_made: attempt,
          total_duration_ms: Date.now() - startTime,
          backoff_strategy: backoffStrategy,
          base_delay_ms: baseDelay,
        });
        throw lastError;
      }

      // Calculate delay with backoff
      let delay = calculateDelay(attempt, baseDelay, maxDelay, backoffStrategy);

      // Check if the delay would exceed the total timeout
      if (totalTimeout !== undefined) {
        const elapsed = Date.now() - startTime;
        const remaining = totalTimeout - elapsed;
        if (remaining <= 0) {
          throw new Error(`Total timeout exceeded: ${elapsed}ms elapsed, ${totalTimeout}ms limit`);
        }
        // If the delay would push us over the total timeout, cap it
        if (delay > remaining) {
          logger.warn({ delay, remaining }, 'delay capped by total timeout');
          delay = remaining;
        }
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt, delay);
      }

      // Wait before next attempt
      await sleep(delay);
    }
  }

  throw lastError || new Error('Operation failed after all retries');
}

/**
 * Execute a function with a timeout
 *
 * @example
 * ```ts
 * const result = await withTimeout(
 *   () => fetch('/api/data'),
 *   { timeout: 5000, timeoutMessage: 'API request timed out' }
 * );
 * ```
 */
export async function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T> {
  const { timeout, timeoutMessage = 'Operation timed out' } = options;

  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeout);

    fn()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Calculate delay for retry with backoff strategy
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  strategy: 'exponential' | 'linear'
): number {
  let delay: number;

  if (strategy === 'exponential') {
    // Exponential: baseDelay * 2^(attempt-1)
    // Attempt 1: 1s, Attempt 2: 2s, Attempt 3: 4s
    delay = Math.pow(2, attempt - 1) * baseDelay;
  } else {
    // Linear: baseDelay * attempt
    // Attempt 1: 1s, Attempt 2: 2s, Attempt 3: 3s
    delay = attempt * baseDelay;
  }

  // Cap at maxDelay
  return Math.min(delay, maxDelay);
}

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry predicate helpers
 */
export const retryPredicates = {
  /** Retry on network errors */
  onNetworkError: (error: Error) => {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    );
  },

  /** Retry on specific HTTP status codes */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onHttpStatus: (statusCodes: number[]) => (error: any) => {
    if ('status' in error) {
      return statusCodes.includes(error.status);
    }
    return false;
  },

  /** Retry on server errors (5xx) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onServerError: (error: any) => {
    if ('status' in error) {
      return error.status >= 500 && error.status < 600;
    }
    return false;
  },

  /** Retry on rate limit (429) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRateLimit: (error: any) => {
    if ('status' in error) {
      return error.status === 429;
    }
    return false;
  },

  /** Combine multiple predicates with OR logic */
  any:
    (...predicates: Array<(error: Error) => boolean>) =>
    (error: Error) => {
      return predicates.some((predicate) => predicate(error));
    },

  /** Combine multiple predicates with AND logic */
  all:
    (...predicates: Array<(error: Error) => boolean>) =>
    (error: Error) => {
      return predicates.every((predicate) => predicate(error));
    },
};
