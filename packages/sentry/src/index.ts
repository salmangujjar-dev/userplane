/**
 * @workspace/sentry - Shared Sentry utilities for userplane
 *
 * This package provides:
 * - Type definitions for tags and contexts
 * - Constants for sensitive data patterns and ignored errors
 * - Filter utilities for beforeSend configuration
 * - Breadcrumb builder helpers
 * - Tag builder utilities
 *
 * Note: Each app still initializes its own Sentry SDK (@sentry/bun, @sentry/nextjs, @sentry/astro)
 * because each has different requirements. This package provides shared utilities.
 *
 * @example API app
 * ```ts
 * import * as Sentry from '@sentry/bun';
 * import { createBeforeSendFilter, IGNORED_ERRORS_API } from '@workspace/sentry';
 *
 * Sentry.init({
 *   dsn: env.sentry.dsn,
 *   beforeSend: createBeforeSendFilter(),
 *   ignoreErrors: [...IGNORED_ERRORS_API],
 * });
 * ```
 *
 * @example Dash client
 * ```ts
 * import * as Sentry from '@sentry/nextjs';
 * import { createBeforeSendFilter, IGNORED_ERRORS_BROWSER } from '@workspace/sentry';
 *
 * Sentry.init({
 *   dsn: env.sentry.dsn,
 *   beforeSend: createBeforeSendFilter({ filterCookies: true }),
 *   ignoreErrors: [...IGNORED_ERRORS_BROWSER],
 * });
 * ```
 *
 * @example Recorder app
 * ```ts
 * import { recorderBeforeSendFilter } from '@workspace/sentry';
 *
 * sentry({
 *   beforeSend: recorderBeforeSendFilter,
 * });
 * ```
 */

// Types
export * from './types/index.js';

// Constants
export * from './constants/index.js';

// Filters
export * from './filters/index.js';

// Utils
export * from './utils/index.js';

// Breadcrumbs
export * from './breadcrumbs/index.js';
