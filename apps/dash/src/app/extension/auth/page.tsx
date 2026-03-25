'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const CHROMIUM_REDIRECT_PATTERN = /^https:\/\/[a-z]{32}\.chromiumapp\.org\//;

export default function ExtensionAuthCallbackPage() {
  const searchParams = useSearchParams();
  const extRedirect = searchParams.get('ext_redirect');

  useEffect(() => {
    if (extRedirect && CHROMIUM_REDIRECT_PATTERN.test(extRedirect)) {
      window.location.href = extRedirect;
    }
  }, [extRedirect]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Authentication complete</h1>
        <p className="mt-2 text-sm text-muted-foreground">You can close this window.</p>
      </div>
    </div>
  );
}
