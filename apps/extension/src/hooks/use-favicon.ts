import { useEffect, useRef, useState } from 'react';

import { getFaviconForUrl } from '@/lib/urls';

interface UseFaviconOptions {
  debounceMs?: number;
}

interface UseFaviconResult {
  faviconUrl: string | null;
  isLoading: boolean;
  handleFaviconError: () => void;
}

export function useFavicon(value: string, options: UseFaviconOptions = {}): UseFaviconResult {
  const { debounceMs = 300 } = options;

  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFaviconError = () => {
    setFaviconUrl(null);
  };

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!value || value.trim() === '') {
      setFaviconUrl(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const url = await getFaviconForUrl(value);

        if (controller.signal.aborted) return;

        setFaviconUrl(url);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching favicon:', error);
          setFaviconUrl(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

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
