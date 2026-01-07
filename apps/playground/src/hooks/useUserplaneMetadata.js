import { useEffect, useRef } from 'react';

/**
 * Custom hook to register metadata with the Userplane SDK
 *
 * This hook registers a metadata callback that returns the provided metadata object.
 * The callback is automatically updated when the metadata changes, ensuring
 * recordings always capture the current application state.
 *
 * @param {Object} metadata - The metadata object to attach to recordings
 *
 * @example
 * ```jsx
 * function App() {
 *   const [user, setUser] = useState(null);
 *
 *   const metadata = useMemo(() => ({
 *     userId: user?.id,
 *     route: location.pathname,
 *     timestamp: new Date().toISOString(),
 *   }), [user, location]);
 *
 *   useUserplaneMetadata(metadata);
 *
 *   return <YourApp />;
 * }
 * ```
 */
export function useUserplaneMetadata(metadata) {
  // Use ref to store latest metadata without triggering re-registration
  const metadataRef = useRef(metadata);
  const registeredRef = useRef(false);

  // Keep ref updated with latest metadata
  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  // Register metadata callback once
  useEffect(() => {
    function registerMetadata() {
      if (
        typeof window !== 'undefined' &&
        window.Userplane &&
        typeof window.Userplane.metadata === 'function'
      ) {
        // Register callback that always returns latest metadata
        window.Userplane.metadata(() => {
          console.log('[useUserplaneMetadata] Metadata requested');
          return {
            ...metadataRef.current,
            capturedAt: new Date().toISOString(),
          };
        });

        registeredRef.current = true;
        console.log('[useUserplaneMetadata] Metadata callback registered');
        return true;
      }
      return false;
    }

    // Try to register immediately
    if (registerMetadata()) {
      return;
    }

    // If SDK not ready, poll until it is (with timeout)
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const interval = setInterval(() => {
      attempts++;
      if (registerMetadata() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts && !registeredRef.current) {
          console.warn('[useUserplaneMetadata] Userplane SDK not available after timeout');
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (
        registeredRef.current &&
        typeof window !== 'undefined' &&
        window.Userplane &&
        typeof window.Userplane.clearMetadata === 'function'
      ) {
        window.Userplane.clearMetadata();
        console.log('[useUserplaneMetadata] Metadata callback cleared');
      }
    };
  }, []);
}

export default useUserplaneMetadata;
