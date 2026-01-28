/**
 * Sentry beforeSend filter utilities
 * Provides consistent filtering of sensitive data across all apps
 */

import {
  FILTER_REPLACEMENTS,
  SENSITIVE_COOKIE_PATTERNS,
  SENSITIVE_EXTRA_PATTERNS,
  SENSITIVE_HEADERS,
  SENSITIVE_REGEX_PATTERNS,
} from '../constants/sensitive.js';

/**
 * Sentry Event type (simplified for our needs)
 * This avoids requiring @sentry/* as a dependency
 * Uses generic type to maintain compatibility with actual Sentry event types
 */
export interface SentryEventLike {
  request?: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  };
  breadcrumbs?: Array<{
    message?: string;
    data?: Record<string, unknown>;
  }>;
  exception?: {
    values?: Array<{
      value?: string;
      stacktrace?: unknown;
    }>;
  };
  extra?: Record<string, unknown>;
}

/**
 * Filter options for customizing beforeSend behavior
 */
export interface FilterOptions {
  /**
   * Additional headers to filter (beyond the defaults)
   */
  additionalHeaders?: string[];

  /**
   * Whether to filter presigned URLs from breadcrumbs and exceptions
   * Default: false (only enabled for recorder app)
   */
  filterPresignedUrls?: boolean;

  /**
   * Whether to filter JWT tokens from exception values
   * Default: false (only enabled for recorder app)
   */
  filterJwtTokens?: boolean;

  /**
   * Whether to filter sensitive extra context keys
   * Default: false (only enabled for recorder app)
   */
  filterExtraContext?: boolean;

  /**
   * Whether to filter cookies based on patterns
   * Default: false (only enabled for dash client)
   */
  filterCookies?: boolean;
}

/**
 * Filter sensitive headers from a Sentry event
 */
function filterHeaders(event: SentryEventLike, additionalHeaders: string[] = []): void {
  if (!event.request?.headers) return;

  const headersToFilter = [...SENSITIVE_HEADERS, ...additionalHeaders];

  for (const header of headersToFilter) {
    if (event.request.headers[header]) {
      event.request.headers[header] = FILTER_REPLACEMENTS.HEADER;
    }
  }
}

/**
 * Filter sensitive cookies from a Sentry event
 */
function filterCookies(event: SentryEventLike): void {
  if (!event.request?.cookies) return;

  for (const key of Object.keys(event.request.cookies)) {
    if (
      SENSITIVE_COOKIE_PATTERNS.some((pattern) => key.toLowerCase().includes(pattern.toLowerCase()))
    ) {
      event.request.cookies[key] = FILTER_REPLACEMENTS.HEADER;
    }
  }
}

/**
 * Filter presigned URLs from breadcrumb messages
 */
function filterBreadcrumbs(event: SentryEventLike): void {
  if (!event.breadcrumbs) return;

  for (const breadcrumb of event.breadcrumbs) {
    if (breadcrumb.message) {
      breadcrumb.message = breadcrumb.message.replace(
        SENSITIVE_REGEX_PATTERNS.PRESIGNED_URL,
        FILTER_REPLACEMENTS.PRESIGNED_URL
      );
    }
  }
}

/**
 * Filter sensitive patterns from exception values
 */
function filterExceptions(
  event: SentryEventLike,
  options: { filterJwt: boolean; filterPresignedUrls: boolean }
): void {
  if (!event.exception?.values) return;

  for (const exception of event.exception.values) {
    if (exception.value) {
      if (options.filterJwt) {
        exception.value = exception.value.replace(
          SENSITIVE_REGEX_PATTERNS.JWT,
          FILTER_REPLACEMENTS.JWT
        );
      }
      if (options.filterPresignedUrls) {
        exception.value = exception.value.replace(
          SENSITIVE_REGEX_PATTERNS.PRESIGNED_URL,
          FILTER_REPLACEMENTS.PRESIGNED_URL
        );
      }
    }
  }
}

/**
 * Filter sensitive keys from extra context
 */
function filterExtraContext(event: SentryEventLike): void {
  if (!event.extra) return;

  for (const key of Object.keys(event.extra)) {
    if (
      SENSITIVE_EXTRA_PATTERNS.some((pattern) => key.toLowerCase().includes(pattern.toLowerCase()))
    ) {
      event.extra[key] = FILTER_REPLACEMENTS.HEADER;
    }
  }
}

/**
 * Create a beforeSend filter function for Sentry
 *
 * @example API app (basic filtering)
 * ```ts
 * Sentry.init({
 *   beforeSend: createBeforeSendFilter(),
 * });
 * ```
 *
 * @example Recorder app (full filtering)
 * ```ts
 * Sentry.init({
 *   beforeSend: createBeforeSendFilter({
 *     filterPresignedUrls: true,
 *     filterJwtTokens: true,
 *     filterExtraContext: true,
 *   }),
 * });
 * ```
 *
 * @example Dash client (cookie filtering)
 * ```ts
 * Sentry.init({
 *   beforeSend: createBeforeSendFilter({
 *     filterCookies: true,
 *   }),
 * });
 * ```
 */
export function createBeforeSendFilter<T extends SentryEventLike>(
  options: FilterOptions = {}
): (event: T) => T {
  return (event: T): T => {
    // Always filter sensitive headers
    filterHeaders(event, options.additionalHeaders);

    // Optional: filter cookies
    if (options.filterCookies) {
      filterCookies(event);
    }

    // Optional: filter presigned URLs from breadcrumbs
    if (options.filterPresignedUrls) {
      filterBreadcrumbs(event);
    }

    // Optional: filter sensitive patterns from exceptions
    if (options.filterJwtTokens || options.filterPresignedUrls) {
      filterExceptions(event, {
        filterJwt: options.filterJwtTokens ?? false,
        filterPresignedUrls: options.filterPresignedUrls ?? false,
      });
    }

    // Optional: filter sensitive extra context
    if (options.filterExtraContext) {
      filterExtraContext(event);
    }

    return event;
  };
}

/**
 * Pre-configured filter for API/server applications
 * Basic header filtering only
 */
export const apiBeforeSendFilter = createBeforeSendFilter();

/**
 * Pre-configured filter for browser/client applications
 * Includes cookie filtering
 */
export const clientBeforeSendFilter = createBeforeSendFilter({
  filterCookies: true,
});

/**
 * Pre-configured filter for recorder application
 * Full filtering including presigned URLs and JWTs
 */
export const recorderBeforeSendFilter = createBeforeSendFilter({
  filterPresignedUrls: true,
  filterJwtTokens: true,
  filterExtraContext: true,
});
