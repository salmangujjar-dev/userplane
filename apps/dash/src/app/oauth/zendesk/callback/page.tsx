'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import {
  InviteErrorState,
  InviteLoadingState,
  InviteTeammatesView,
} from '@/components/integrations/intercom';
import { DinoError } from '@/components/shared/dino-error';
import { env } from '@/env';
import { useSession } from '@/features/auth';
import { useFirstWorkspaceDomain } from '@/features/domains';
import { useZendeskAgents } from '@/features/integrations';

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

  async function completeOAuth(zendeskCode: string, zendeskState: string) {
    try {
      const response = await fetch(`${env.api.url}/api/v1/zendesk/connect/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zendeskCode, zendeskState }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${response.status})`);
      }

      const { data } = await response.json();

      if (data.workspaceId) {
        setCompletedWorkspaceId(data.workspaceId);
      } else {
        window.close();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete authorization');
    }
  }

  // Missing params are derivable from the URL, so they don't need to be mirrored
  // into state from an effect.
  const missingParams = !code || !state;

  useEffect(() => {
    if (completedRef.current) return;
    if (sessionLoading) return;
    if (!session) return;
    if (!code || !state) return;

    completedRef.current = true;
    void (async () => {
      await completeOAuth(code, state);
    })();
  }, [code, state, session, sessionLoading]);

  // Show invite teammates after connection
  if (completedWorkspaceId) {
    return <PostConnectionInviteView workspaceId={completedWorkspaceId} />;
  }

  const displayError = missingParams ? 'Missing OAuth parameters from Zendesk.' : error;

  if (displayError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <DinoError
          title="Authorization Failed"
          description={displayError}
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
 * Fetches Zendesk agents and displays them as invite suggestions.
 */
function PostConnectionInviteView({ workspaceId }: { workspaceId: string }) {
  const {
    data: agentsData,
    isLoading: agentsLoading,
    error: agentsError,
    refetch: refetchAgents,
  } = useZendeskAgents(workspaceId, true);
  const { data: domainsData, isLoading: domainsLoading } = useFirstWorkspaceDomain(workspaceId);

  const isLoading = agentsLoading || domainsLoading;

  if (isLoading) {
    return <InviteLoadingState variant="zendesk" />;
  }

  if (agentsError || !agentsData?.success) {
    return (
      <InviteErrorState
        workspaceId={workspaceId}
        variant="zendesk"
        message={
          agentsData?.success === false ? agentsData.error.message : 'Failed to load teammates'
        }
        onRetry={() => refetchAgents()}
      />
    );
  }

  const teammates = agentsData.data.agents;
  const firstDomain = domainsData?.success ? domainsData.data.domains[0] : null;

  return (
    <InviteTeammatesView
      workspaceId={workspaceId}
      teammates={teammates}
      invitePolicy={agentsData.data.invitePolicy}
      allowedDomains={agentsData.data.allowedDomains}
      initialDomainId={firstDomain?.domainId ?? null}
      initialDomainUrl={firstDomain?.domainUrl ?? ''}
      variant="zendesk"
      completionLabel="Go to dashboard"
      onComplete={() => {
        window.open(`/workspace/${workspaceId}`, '_blank');
        window.close();
      }}
      onSkip={() => window.close()}
    />
  );
}
