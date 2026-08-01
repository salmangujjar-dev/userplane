import { useEffect, useState } from 'react';

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

  const url = value.trim();
  // Results carry the url they were fetched for, so `isLoading` and the favicon
  // itself are derived rather than stored — a slow response for a previous url
  // can never be shown against the current one.
  const [resolved, setResolved] = useState<{ url: string; faviconUrl: string | null } | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const faviconUrl = await getFaviconForUrl(url);
        if (!cancelled) setResolved({ url, faviconUrl });
      } catch (error) {
        console.error('Error fetching favicon:', error);
        if (!cancelled) setResolved({ url, faviconUrl: null });
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [url, debounceMs]);

  const resolvedForUrl = resolved?.url === url ? resolved : null;

  return {
    faviconUrl: resolvedForUrl && failedUrl !== url ? resolvedForUrl.faviconUrl : null,
    isLoading: Boolean(url) && resolvedForUrl === null,
    handleFaviconError: () => setFailedUrl(url),
  };
}
