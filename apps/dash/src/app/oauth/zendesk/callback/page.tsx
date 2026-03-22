'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { InviteLoadingState, InviteTeammatesView } from '@/components/integrations/intercom';
import { DinoError } from '@/components/shared/dino-error';
import { env } from '@/env';
import { useSession } from '@/features/auth';
import { useFirstWorkspaceDomain } from '@/features/domains';
import { useInvitePolicy } from '@/features/workspace';

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
  const [completedWorkspaceId, setCompletedWorkspaceId] = useState<string | null>(null);
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
        // Show invite teammates view before closing
        if (data.workspaceId) {
          setCompletedWorkspaceId(data.workspaceId);
        } else {
          window.close();
        }
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

  // Show invite teammates after connection
  if (completedWorkspaceId) {
    return <PostConnectionInviteView workspaceId={completedWorkspaceId} />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <DinoError
          title="Authorization Failed"
          description={error}
          onRetry={() => window.location.reload()}
          onGoBack={() => window.close()}
        />
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

/**
 * Post-connection invite view shown in the popup after Zendesk OAuth completes.
 * Reuses the InviteTeammatesView with empty teammates (manual email entry only).
 */
function PostConnectionInviteView({ workspaceId }: { workspaceId: string }) {
  const { data: domainsData, isLoading: domainsLoading } = useFirstWorkspaceDomain(workspaceId);
  const { data: policyData, isLoading: policyLoading } = useInvitePolicy(workspaceId);

  const isLoading = domainsLoading || policyLoading;

  if (isLoading) {
    return <InviteLoadingState />;
  }

  const firstDomain = domainsData?.success ? domainsData.data.domains[0] : null;
  const invitePolicy = policyData?.success ? policyData.data.workspaceInvitePolicy : 'private';
  const allowedDomains = policyData?.success ? policyData.data.workspaceInviteDomains : null;

  return (
    <InviteTeammatesView
      workspaceId={workspaceId}
      teammates={[]}
      invitePolicy={invitePolicy}
      allowedDomains={allowedDomains}
      initialDomainId={firstDomain?.domainId ?? null}
      initialDomainUrl={firstDomain?.domainUrl ?? ''}
      completionLabel="Done"
      onComplete={() => window.close()}
      onSkip={() => window.close()}
    />
  );
}
