'use client';

import { Button } from '@userplane/ui/components/button';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { useSession } from '@/features/auth';
import { useCreateWorkspace, useWorkspaces } from '@/features/workspace';
import { env } from '@/env';

/**
 * OAuth Authorize Page
 * Rendered inside Zendesk's popup during the built-in app OAuth flow.
 *
 * Wrapped in Suspense because useSearchParams() requires it in Next.js 13+.
 */
export default function OAuthZendeskAuthorizePage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <OAuthZendeskAuthorizeContent />
    </Suspense>
  );
}

function OAuthZendeskAuthorizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isPending: sessionLoading } = useSession();
  const { data: workspacesResult } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  // Mode: 'popup' = in-app OAuth (from Zendesk iframe), otherwise = built-in OAuth
  const mode = searchParams.get('mode');
  const isPopupMode = mode === 'popup';

  // Outer OAuth params (only used in built-in OAuth mode)
  const clientId = searchParams.get('client_id') ?? '';
  const redirectUri = searchParams.get('redirect_uri') ?? '';
  const state = searchParams.get('state') ?? '';
  const responseType = searchParams.get('response_type') ?? '';

  // Form state
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [subdomain, setSubdomain] = useState(searchParams.get('subdomain') ?? '');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceUrl, setNewWorkspaceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useWorkspaces returns SafeResult wrapping workspace list
  const workspacesData = workspacesResult?.success ? workspacesResult.data : null;
  const workspaces = workspacesData?.workspaces ?? [];

  // Auto-select first workspace
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0]!.workspaceId);
    }
  }, [workspaces, selectedWorkspaceId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session) {
      const returnTo = `/oauth/zendesk/authorize?${searchParams.toString()}`;
      router.push(`/auth?redirect_to=${encodeURIComponent(returnTo)}`);
    }
  }, [session, sessionLoading, router, searchParams]);

  // Validate outer params (only in built-in OAuth mode)
  if (!isPopupMode) {
    if (responseType && responseType !== 'code') {
      return <ErrorScreen message="Invalid response_type. Only 'code' is supported." />;
    }

    if (!clientId || !redirectUri || !state) {
      return <ErrorScreen message="Missing required OAuth parameters." />;
    }
  }

  if (sessionLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (!session) {
    return <LoadingScreen message="Redirecting to sign in..." />;
  }

  async function handleAuthorize() {
    setError(null);
    setIsSubmitting(true);

    try {
      let workspaceId = selectedWorkspaceId;

      // Create workspace if in creation mode
      if (isCreatingWorkspace && newWorkspaceUrl) {
        const result = await createWorkspace.mutateAsync({
          type: 'manual',
          url: newWorkspaceUrl,
        });
        if (!result?.success || !result.data?.created) {
          throw new Error('Failed to create workspace');
        }
        workspaceId = result.data.workspaceId;
      }

      if (!workspaceId) {
        setError('Please select or create a workspace.');
        setIsSubmitting(false);
        return;
      }

      if (!subdomain.trim()) {
        setError('Please enter your Zendesk subdomain.');
        setIsSubmitting(false);
        return;
      }

      // Call API to initiate the OAuth flow
      const body: Record<string, string> = {
        workspaceId,
        subdomain: subdomain.trim(),
        mode: isPopupMode ? 'popup' : 'oauth',
      };
      if (!isPopupMode) {
        body.outerRedirectUri = redirectUri;
        body.outerState = state;
        body.outerClientId = clientId;
      }

      const response = await fetch(`${env.api.url}/api/v1/oauth/zendesk/initiate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${response.status})`);
      }

      const { data } = await response.json();

      // Redirect to Zendesk OAuth in the same popup
      window.location.href = data.zendeskAuthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Header logos */}
        <div className="flex items-center gap-4">
          <Logo />
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold">Zendesk</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-medium text-foreground">Connect Userplane to Zendesk</h1>
          <p className="text-sm text-muted-foreground text-center">
            Authorize your Zendesk app to access your Userplane workspace.
          </p>
        </div>

        {/* Form */}
        <div className="w-full p-6 rounded-xl border bg-card space-y-4">
          {/* Workspace selection */}
          <div className="space-y-2">
            <Label>Workspace</Label>
            {!isCreatingWorkspace ? (
              <>
                {workspaces.length > 0 ? (
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={selectedWorkspaceId}
                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  >
                    {workspaces.map((ws) => (
                      <option key={ws.workspaceId} value={ws.workspaceId}>
                        {ws.workspaceName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">No workspaces found.</p>
                )}
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setIsCreatingWorkspace(true)}
                >
                  Create new workspace
                </button>
              </>
            ) : (
              <>
                <Input
                  placeholder="your-company.com"
                  value={newWorkspaceUrl}
                  onChange={(e) => setNewWorkspaceUrl(e.target.value)}
                />
                {workspaces.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setIsCreatingWorkspace(false)}
                  >
                    Select existing workspace
                  </button>
                )}
              </>
            )}
          </div>

          {/* Zendesk subdomain */}
          <div className="space-y-2">
            <Label>Zendesk subdomain</Label>
            <div className="flex items-center gap-1">
              <Input
                placeholder="your-company"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">.zendesk.com</span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleAuthorize} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect & Authorize'
            )}
          </Button>
        </div>

        <button
          type="button"
          className="text-xs text-muted-foreground hover:underline"
          onClick={() => window.close()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <h1 className="text-xl font-medium text-foreground">Authorization Error</h1>
        <p className="text-sm text-destructive">{message}</p>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:underline"
          onClick={() => window.close()}
        >
          Close
        </button>
      </div>
    </div>
  );
}
