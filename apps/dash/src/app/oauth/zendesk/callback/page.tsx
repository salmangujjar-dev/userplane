'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { env } from '@/env';
import { useSession } from '@/features/auth';

/**
 * Nested Zendesk OAuth Callback Page
 * Wrapped in Suspense because useSearchParams() requires it in Next.js 13+.
 */
export default function OAuthZendeskCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <OAuthZendeskCallbackContent />
    </Suspense>
  );
}

function OAuthZendeskCallbackContent() {
  const searchParams = useSearchParams();
  const { session, isPending: sessionLoading } = useSession();
  const [error, setError] = useState<string | null>(null);
  const completedRef = useRef(false);

  const code = searchParams.get('code');
  const state = searchParams.get('state');

  useEffect(() => {
    if (completedRef.current) return;
    if (sessionLoading) return;
    if (!session) return;
    if (!code || !state) {
      setError('Missing OAuth parameters from Zendesk.');
      return;
    }

    completedRef.current = true;
    completeOAuth(code, state);
  }, [code, state, session, sessionLoading]);

  async function completeOAuth(innerCode: string, innerState: string) {
    try {
      const response = await fetch(`${env.api.url}/api/v1/oauth/zendesk/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ innerCode, innerState }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${response.status})`);
      }

      const { data } = await response.json();

      if (data.mode === 'popup') {
        // Popup mode: close the window. User clicks "Refresh" in the iframe.
        window.close();
        return;
      }

      // Built-in OAuth mode: redirect to Zendesk's callback with our auth code
      const url = new URL(data.outerRedirectUri);
      url.searchParams.set('code', data.outerCode);
      url.searchParams.set('state', data.outerState);
      window.location.href = url.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete authorization');
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <h1 className="text-xl font-medium text-foreground">Authorization Failed</h1>
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline mt-2"
            onClick={() => window.close()}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Completing setup...</p>
      </div>
    </div>
  );
}
