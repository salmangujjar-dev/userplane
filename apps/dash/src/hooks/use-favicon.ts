import { useState, useEffect, useRef } from 'react';
import { getFaviconForUrl, checkIfDefaultFavicon, getGoogleFaviconUrl } from '@/lib/url-utils';

interface UseFaviconOptions {
  debounceMs?: number;
}

interface UseFaviconResult {
  faviconUrl: string | null;
  isLoading: boolean;
  handleFaviconError: () => void;
}

/**
 * Hook to fetch and manage favicon for a URL input
 * Includes debouncing to prevent excessive API calls
 */
export function useFavicon(value: string, options: UseFaviconOptions = {}): UseFaviconResult {
  const { debounceMs = 300 } = options;

  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [fallbackDomain, setFallbackDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle favicon image load errors
   * If local icon fails, try Google's favicon API
   */
  const handleFaviconError = () => {
    if (fallbackDomain && faviconUrl?.startsWith('/preview/')) {
      checkIfDefaultFavicon(fallbackDomain, 64).then((result) => {
        if (result.isDefault) {
          setFaviconUrl(null);
        } else {
          setFaviconUrl(getGoogleFaviconUrl(fallbackDomain, 64));
        }
        setFallbackDomain(null);
      });
    } else {
      setFaviconUrl(null);
      setFallbackDomain(null);
    }
  };

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state if value is empty
    if (!value || value.trim() === '') {
      setFaviconUrl(null);
      setFallbackDomain(null);
      setIsLoading(false);
      return;
    }

    // Debounce the favicon fetch
    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const result = await getFaviconForUrl(value);

        // Check if this request was aborted
        if (controller.signal.aborted) return;

        setFaviconUrl(result.url);
        setFallbackDomain(result.fallbackDomain);
      } catch (error) {
        // Only log if not aborted
        if (!controller.signal.aborted) {
          console.error('Error fetching favicon:', error);
          setFaviconUrl(null);
          setFallbackDomain(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, debounceMs]);

  return {
    faviconUrl,
    isLoading,
    handleFaviconError,
  };
}
