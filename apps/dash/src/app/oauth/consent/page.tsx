'use client';

import { Button } from '@userplane/ui/components/button';
import Logo from '@userplane/ui/components/logo';
import { Skeleton } from '@userplane/ui/components/skeleton';
import { Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { AuthHeader, AuthLayout } from '@/components/auth/auth-shell';
import { DinoError } from '@/components/shared/dino-error';
import { env } from '@/env';
import { useSession } from '@/features/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientInfo {
  clientId: string;
  name: string;
  uri?: string;
  icon?: string;
  contacts?: string[];
  tos?: string;
  policy?: string;
}

// ---------------------------------------------------------------------------
// Scope display labels
// ---------------------------------------------------------------------------

const SCOPE_LABELS: Record<string, string> = {
  openid: 'Verify your identity',
  profile: 'View your profile information',
  email: 'View your email address',
  'mcp:tools': 'Access workspace tools and data',
};

function getScopeLabel(scope: string): string {
  return SCOPE_LABELS[scope] ?? scope;
}

// ---------------------------------------------------------------------------
// Consent page content
// ---------------------------------------------------------------------------

function ConsentContent() {
  const searchParams = useSearchParams();
  const { session, isPending: sessionLoading } = useSession();

  const clientId = searchParams.get('client_id');
  const scopeParam = searchParams.get('scope') ?? '';
  const scopes = scopeParam.split(' ').filter(Boolean);

  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch client info
  useEffect(() => {
    if (!clientId || !session) return;

    let cancelled = false;

    async function fetchClientInfo() {
      try {
        const res = await fetch(
          `${env.api.url}/api/auth/oauth2/public-client?client_id=${encodeURIComponent(clientId!)}`,
          { credentials: 'include' }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Failed to load application info (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) {
          setClientInfo(data);
          setIsLoadingClient(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load application info');
          setIsLoadingClient(false);
        }
      }
    }

    fetchClientInfo();

    return () => {
      cancelled = true;
    };
  }, [clientId, session]);

  // Submit consent decision
  const handleConsent = useCallback(async (accept: boolean) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${env.api.url}/api/auth/oauth2/consent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accept,
          oauth_query: window.location.search.slice(1),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Authorization failed (${res.status})`);
      }

      if (data.redirect && data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error(data.message || 'Unexpected response from authorization server');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  }, []);

  // Missing client_id
  if (!clientId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background">
        <DinoError
          title="Invalid Request"
          description="No application identifier was provided."
          showRetry={false}
          showGoBack={false}
        />
      </div>
    );
  }

  // Loading session
  if (sessionLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  // No session (middleware will redirect, show loading in the meantime)
  if (!session) {
    return <LoadingScreen message="Redirecting to sign in..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background">
        <DinoError
          title="Authorization Error"
          description={error}
          onRetry={() => {
            setError(null);
            setIsLoadingClient(true);
            setClientInfo(null);
            // Re-trigger fetch
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Loading client info
  if (isLoadingClient) {
    return <LoadingScreen message="Loading application info..." />;
  }

  const displayName = clientInfo?.name || clientId;

  return (
    <AuthLayout>
      <AuthHeader subtitle="An application is requesting access to your account" />

      <div className="space-y-6">
        {/* Client info */}
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          {clientInfo?.icon ? (
            <Image
              src={clientInfo.icon}
              alt={displayName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-xs font-medium text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            {clientInfo?.uri && (
              <p className="text-xs text-muted-foreground truncate">{clientInfo.uri}</p>
            )}
          </div>
        </div>

        {/* Requested permissions */}
        {scopes.length > 0 && (
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-2.5 border-b">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Requested permissions
              </p>
            </div>
            <div className="divide-y">
              {scopes.map((scope) => (
                <div key={scope} className="flex items-center gap-3 px-4 py-3">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{getScopeLabel(scope)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allow button */}
        <Button
          onClick={() => handleConsent(true)}
          disabled={isSubmitting}
          size="lg"
          className="w-full px-7 py-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Authorizing...
            </>
          ) : (
            'Allow'
          )}
        </Button>

        {/* Deny link */}
        <div className="flex justify-center">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline"
            disabled={isSubmitting}
            onClick={() => handleConsent(false)}
          >
            Deny
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

// ---------------------------------------------------------------------------
// Loading screen
// ---------------------------------------------------------------------------

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton fallback
// ---------------------------------------------------------------------------

function ConsentSkeleton() {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default function ConsentPage() {
  return (
    <Suspense fallback={<ConsentSkeleton />}>
      <ConsentContent />
    </Suspense>
  );
}
