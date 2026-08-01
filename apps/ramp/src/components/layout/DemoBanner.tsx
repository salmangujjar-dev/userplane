'use client';

import { XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const DEMO_BANNER_DISMISSED_KEY = 'ramp-demo-banner-dismissed';

function hasDismissedBanner() {
  try {
    return window.localStorage.getItem(DEMO_BANNER_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function DemoBanner() {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  // localStorage isn't readable during SSR, so the first client render resolves
  // it in a microtask rather than synchronously inside an effect.
  useEffect(() => {
    queueMicrotask(() => setDismissed(hasDismissedBanner()));
  }, []);

  const isVisible = dismissed === false;
  const setIsVisible = (visible: boolean) => setDismissed(!visible);

  const dismissBanner = () => {
    try {
      window.localStorage.setItem(DEMO_BANNER_DISMISSED_KEY, 'true');
    } catch {
      // Keep the in-page dismissal working even if storage is unavailable.
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-label="Demo notice"
      className="shrink-0 border-b border-border/70 bg-sidebar/90 text-muted-foreground"
      role="status"
    >
      <div className="relative flex min-h-9 items-center justify-center px-11 py-1.5 text-center text-xs leading-5 sm:px-12">
        <p>This is a demo app built for Userplane.</p>
        <Button
          aria-label="Dismiss demo banner"
          className="absolute right-2 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={dismissBanner}
          size="icon-xs"
          variant="ghost"
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
