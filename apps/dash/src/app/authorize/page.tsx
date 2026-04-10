'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { env } from '@/env';

/**
 * OAuth Authorize Bridge
 *
 * The oauthProvider plugin redirects here with signed OAuth params when the
 * user needs to log in. The dashboard middleware treats this as a protected
 * route, so unauthenticated users are sent to /auth?redirect_to=/authorize?<params>.
 * After login they return here, and this page forwards them to the API's
 * authorize endpoint to continue the OAuth flow.
 */
function AuthorizeContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    window.location.href = `${env.api.url}/api/auth/oauth2/authorize?${searchParams.toString()}`;
  }, [searchParams]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">Authorizing...</p>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthorizeContent />
    </Suspense>
  );
}
