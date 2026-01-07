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

/**
 * Primitive types that can be safely serialized
 */
type SerializablePrimitive = string | number | boolean | null | undefined;

/**
 * Array containing any serializable values
 */
type SerializableArray = Serializable[];

/**
 * Object with string or number keys containing serializable values
 */
export interface SerializableObject extends Record<string | number, Serializable> {}

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
 * Retrieves the custom metadata by executing the stored metadata function.
 *
 * @returns The metadata object, or null if no metadata function is set or it fails
 *
 * @remarks
 * This function is called internally by the SDK when the recorder requests
 * custom metadata via the bridge. It safely executes the user-provided
 * metadata function and handles any errors gracefully.
 */
export function getCustomMetadata(): SerializableObject | null {
  try {
    const metadataFn = window.__userplane__?.exports?.metadata;

    if (typeof metadataFn !== 'function') {
      return null;
    }

    const result = metadataFn();

    // Validate result is an object
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      console.warn('[Userplane] metadata function must return an object');
      return null;
    }

    return result;
  } catch (error) {
    console.error('[Userplane] Error executing metadata function:', error);
    return null;
  }
}

/**
 * Clears the stored metadata function.
 * Useful for cleanup or testing.
 */
export function clearMetadata(): void {
  if (window.__userplane__?.exports) {
    window.__userplane__.exports.metadata = undefined;
  }
}
