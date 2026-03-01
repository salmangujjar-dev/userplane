/**
 * Metadata Module
 * Allows developers to attach custom metadata to recordings via a callback function.
 *
 * How it works:
 * 1. Developer calls userplane.metadata(fn) in their application
 * 2. SDK stores the function at window.__userplane__.exports.metadata
 * 3. When recorder requests metadata, SDK executes the function
 * 4. Returned data is included in the recording session
 *
 * @example
 * ```typescript
 * import { userplane } from '@userplane/sdk';
 *
 * userplane.metadata(() => ({
 *   userId: getCurrentUser().id,
 *   plan: 'enterprise',
 *   featureFlags: getActiveFlags()
 * }));
 * ```
 */

import { createLogger } from '@userplane/console-logger';

declare const __DEV__: boolean;

const logger = createLogger('Metadata', {
  level: typeof __DEV__ !== 'undefined' && __DEV__ ? 'debug' : 'warn',
});

/**
 * Primitive types that can be safely serialized
 */
type SerializablePrimitive = string | number | boolean | null | undefined;

/**
 * Array containing any serializable values
 */
type SerializableArray = Array<Serializable>;

/**
 * Object with string or number keys containing serializable values
 */
export interface SerializableObject {
  [key: string]: Serializable;
  [key: number]: Serializable;
}

/**
 * Union type representing all values that can be safely serialized
 */
export type Serializable = SerializablePrimitive | SerializableArray | SerializableObject;

/**
 * Function type for metadata callback
 */
export type MetadataFunction = () => SerializableObject;

/**
 * The global Userplane namespace path on the window object
 */
const USERPLANE_NAMESPACE_PATH = ['__userplane__', 'exports'] as const;

/**
 * Type declaration for window augmentation
 */
declare global {
  interface Window {
    __userplane__?: {
      exports?: {
        metadata?: MetadataFunction;
        staticMetadata?: SerializableObject;
      };
    };
  }
}

/**
 * Creates or retrieves a nested object path within a given object.
 * If any part of the path doesn't exist, creates an empty object at that location.
 *
 * @param object - The root object to traverse/modify
 * @param path - Array of string keys representing the path
 * @returns The object at the end of the specified path
 * @throws Error if an existing path segment is not an object
 */
function createOrGetObjectPath(
  object: Record<string, unknown>,
  path: readonly string[]
): Record<string, unknown> {
  let currentObject = object;

  for (const pathPart of path) {
    if (pathPart in currentObject) {
      const existingValue = currentObject[pathPart];

      if (!existingValue || typeof existingValue !== 'object') {
        throw new Error(`Existing object path is invalid. Part ${pathPart} is not an object.`);
      }

      currentObject = existingValue as Record<string, unknown>;
    } else {
      const newObject: Record<string, unknown> = {};
      currentObject[pathPart] = newObject;
      currentObject = newObject;
    }
  }

  return currentObject;
}

/**
 * Gets or creates the Userplane exports object on the browser's window global.
 *
 * @returns The Userplane exports object at window.__userplane__.exports
 */
function getUserplaneExportsObject(): Record<string, unknown> {
  return createOrGetObjectPath(
    window as unknown as Record<string, unknown>,
    USERPLANE_NAMESPACE_PATH
  );
}

/**
 * Sets a metadata function for Userplane recordings.
 *
 * The provided function will be called when a recording is being submitted,
 * and the returned data will be attached as custom metadata to the recording.
 *
 * @param metadataFunction - A function that returns a serializable object
 *
 * @remarks
 * **How It Works:**
 * 1. Developer calls `userplane.metadata(fn)` in their application
 * 2. SDK stores the function at `window.__userplane__.exports.metadata`
 * 3. When recorder submits, it calls `getCustomMetadata()` via bridge
 * 4. Host executes the stored function and returns the data
 * 5. Recorder includes the metadata in the submission
 *
 * **When is the metadata function called?**
 * - Not immediately when you call `userplane.metadata()`
 * - Only when a recording is being submitted
 * - Should execute quickly (< 100ms recommended)
 *
 * **What data should you include?**
 * - User context (ID, role, subscription tier)
 * - Application state (route, feature flags, version)
 * - Session information (session ID, duration)
 * - Business context relevant to debugging
 *
 * **Multiple Calls:**
 * - Calling `metadata()` multiple times overwrites the previous function
 * - Only the most recent function will be used
 *
 * @example
 * ```typescript
 * import { userplane } from '@userplane/sdk';
 *
 * // Basic usage
 * userplane.metadata(() => ({
 *   userId: getCurrentUser().id,
 *   version: APP_VERSION
 * }));
 *
 * // With error handling
 * userplane.metadata(() => {
 *   try {
 *     return {
 *       user: {
 *         id: getCurrentUser().id,
 *         plan: getCurrentUser().plan
 *       },
 *       route: window.location.pathname,
 *       flags: getFeatureFlags()
 *     };
 *   } catch (error) {
 *     return { error: 'Failed to collect metadata' };
 *   }
 * });
 *
 * // React integration
 * function App() {
 *   const user = useUser();
 *
 *   useEffect(() => {
 *     userplane.metadata(() => ({
 *       userId: user?.id,
 *       email: user?.email
 *     }));
 *   }, [user]);
 *
 *   return <YourApp />;
 * }
 * ```
 */
export function metadata(metadataFunction: MetadataFunction): void {
  const userplaneExports = getUserplaneExportsObject();
  userplaneExports.metadata = metadataFunction;
}

/**
 * Sets static key-value metadata as defaults that can be overridden by the metadata function.
 *
 * Use this for default/fallback data that should be included unless explicitly overridden:
 * - Default application version (can be overridden per-environment)
 * - Fallback values
 * - Base configuration
 * - Static identifiers
 *
 * @param key - The metadata key (must be a string)
 * @param value - Any serializable value
 *
 * @remarks
 * **Static vs Function Metadata:**
 * - Static metadata set via `set()` provides defaults
 * - Function metadata (from `metadata()`) takes priority and can override static keys
 * - This allows dynamic overrides when needed while maintaining defaults
 *
 * **Multiple Calls:**
 * - Each call to `set()` adds or updates that specific key
 * - Does not affect other keys
 * - To remove a key, use `clearMetadata(key)`
 *
 * @example
 * ```typescript
 * import { userplane } from '@userplane/sdk';
 *
 * // Set static metadata as defaults
 * userplane.set('appVersion', '2.1.0');
 * userplane.set('environment', 'production');
 * userplane.set('buildId', '12345');
 *
 * // Register a function that can override
 * userplane.metadata(() => ({
 *   userId: getCurrentUser().id,
 *   appVersion: '3.0.0-beta',  // This OVERRIDES the static value
 * }));
 *
 * // Result will have:
 * // { appVersion: '3.0.0-beta', environment: 'production', buildId: '12345', userId: '...' }
 * ```
 */
export function set(key: string, value: Serializable): void {
  const userplaneExports = getUserplaneExportsObject();

  // Initialize staticMetadata if it doesn't exist
  if (!userplaneExports.staticMetadata) {
    userplaneExports.staticMetadata = {};
  }

  const staticMetadata = userplaneExports.staticMetadata as SerializableObject;
  staticMetadata[key] = value;
}

/**
 * Retrieves the custom metadata by merging static key-value pairs and function results.
 *
 * @returns The merged metadata object, or null if no metadata is available
 *
 * @remarks
 * **Merge Order:**
 * 1. Start with static key-value pairs (defaults)
 * 2. Overlay function metadata (function takes priority)
 * 3. Return merged result
 *
 * This allows the dynamic function to override static defaults when needed.
 *
 * This function is called internally by the SDK when the recorder requests
 * custom metadata via the bridge. It safely executes the user-provided
 * metadata function and handles any errors gracefully.
 */
export function getCustomMetadata(): SerializableObject | null {
  let result: SerializableObject = {};
  let hasData = false;

  // 1. Start with static metadata (defaults)
  const staticMetadata = window.__userplane__?.exports?.staticMetadata;
  if (staticMetadata && typeof staticMetadata === 'object') {
    result = { ...staticMetadata };
    hasData = true;
  }

  // 2. Overlay function metadata (takes priority)
  try {
    const metadataFn = window.__userplane__?.exports?.metadata;

    if (typeof metadataFn === 'function') {
      const fnResult = metadataFn();

      // Validate result is an object
      if (fnResult && typeof fnResult === 'object' && !Array.isArray(fnResult)) {
        result = { ...result, ...fnResult };
        hasData = true;
      } else {
        logger.warn('metadata function must return an object');
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Error executing metadata function');
  }

  return hasData ? result : null;
}

/**
 * Clears metadata based on the provided parameter.
 *
 * @param keyOrType - Optional parameter to control what gets cleared:
 *   - undefined: Clears both function and all static metadata (default)
 *   - 'function': Clears only the metadata function
 *   - 'static': Clears all static key-value pairs
 *   - string key: Clears that specific static key
 *
 * @remarks
 * Useful for cleanup, testing, or when user logs out.
 *
 * @example
 * ```typescript
 * // Clear everything
 * userplane.clearMetadata();
 *
 * // Clear only the function
 * userplane.clearMetadata('function');
 *
 * // Clear all static metadata
 * userplane.clearMetadata('static');
 *
 * // Clear a specific key
 * userplane.clearMetadata('userId');
 * ```
 */
export function clearMetadata(keyOrType?: string): void {
  if (!window.__userplane__?.exports) return;

  const exports = window.__userplane__.exports;

  // No parameter - clear everything
  if (keyOrType === undefined) {
    exports.metadata = undefined;
    exports.staticMetadata = undefined;
    return;
  }

  // Clear only the function
  if (keyOrType === 'function') {
    exports.metadata = undefined;
    return;
  }

  // Clear all static metadata
  if (keyOrType === 'static') {
    exports.staticMetadata = undefined;
    return;
  }

  // Clear a specific static key
  if (exports.staticMetadata && typeof exports.staticMetadata === 'object') {
    delete exports.staticMetadata[keyOrType];
  }
}
