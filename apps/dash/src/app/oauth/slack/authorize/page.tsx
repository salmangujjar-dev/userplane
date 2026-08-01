'use client';

import { Button } from '@userplane/ui/components/button';
import Logo from '@userplane/ui/components/logo';
import { ArrowLeftRight, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { apiClient } from '@/client';
import { AuthIcons } from '@/components/auth/auth-icons';
import { DinoError } from '@/components/shared/dino-error';
import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from '@/components/shared/workspace-avatar';
import { useSession } from '@/features/auth';
import { useWorkspaces } from '@/features/workspace';
import { handleSafeResult } from '@/lib/errors';
import { mediaClient } from '@/lib/media';

/**
 * OAuth Authorize Page
 * Shown when a Slack user clicks "Connect workspace" from the Slack app.
 * For users with workspaces: select one and authorize.
 * For users without workspaces: redirect to /workspace/create?flow=slack.
 */
export default function OAuthSlackAuthorizePage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <OAuthSlackAuthorizeContent />
    </Suspense>
  );
}

function OAuthSlackAuthorizeContent() {
  const router = useRouter();
  const { session, isPending: sessionLoading } = useSession();
  const { data: workspacesResult, isLoading: workspacesLoading } = useWorkspaces();

  // Form state
  const [chosenWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspaces = useMemo(() => {
    const data = workspacesResult?.success ? workspacesResult.data : null;
    return data?.workspaces ?? [];
  }, [workspacesResult]);

  // Auto-select first workspace
  // Default to the first workspace until the user picks one — derived rather than
  // synced into state from an effect.
  const selectedWorkspaceId = chosenWorkspaceId || workspaces[0]?.workspaceId || '';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session) {
      const returnTo = '/oauth/slack/authorize';
      router.push(`/auth?redirect_to=${encodeURIComponent(returnTo)}`);
    }
  }, [session, sessionLoading, router]);

  // 0 workspaces: redirect to workspace create flow
  const hasRedirectedRef = useRef(false);
  useEffect(() => {
    if (workspacesLoading || !workspacesResult) return;
    if (workspaces.length > 0) return;
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    router.replace('/workspace/create?flow=slack');
  }, [workspacesLoading, workspacesResult, workspaces, router]);

  if (sessionLoading || workspacesLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!session) {
    return <LoadingScreen message="Redirecting to sign in..." />;
  }

  // 0 workspaces: redirect handled by effect above
  if (workspaces.length === 0) {
    return <LoadingScreen message="Setting up..." />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  async function handleAuthorize() {
    setError(null);
    setIsSubmitting(true);

    try {
      if (!selectedWorkspaceId) {
        setError('Please select a workspace.');
        setIsSubmitting(false);
        return;
      }

      const [apiError, response] = await apiClient.workspace.integrations.slack.authorize({
        params: { workspaceId: selectedWorkspaceId },
      });
      const result = handleSafeResult(apiError, response?.data ?? null);

      if (!result.success) {
        throw new Error(result.error.message || 'Failed to generate authorization URL');
      }

      window.location.href = result.data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Need a new workspace?</span>
          <button
            onClick={() => router.push('/workspace/create?flow=slack')}
            className="text-foreground hover:text-foreground transition-colors font-medium"
          >
            Create workspace
          </button>
        </div>
      </div>

      <div className="w-full max-w-md space-y-10 relative z-10">
        {/* Integration header */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src={mediaClient.getIntegrationMediaUrl('integrations/slack.webp')}
                alt="Slack"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">Connect Userplane to Slack</h1>
            <p className="text-sm text-muted-foreground text-center">
              Select a workspace to connect with your Slack workspace.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Workspace list — matches sidebar workspace selector */}
          <div className="space-y-1">
            <div className="max-h-64 overflow-y-auto rounded-lg border bg-card">
              {workspaces.map((ws) => (
                <button
                  key={ws.workspaceId}
                  type="button"
                  onClick={() => setSelectedWorkspaceId(ws.workspaceId)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                    selectedWorkspaceId === ws.workspaceId ? 'bg-accent/30' : ''
                  }`}
                >
                  <WorkspaceAvatar
                    workspaceId={ws.workspaceId}
                    workspaceName={ws.workspaceName}
                    size={WORKSPACE_AVATAR_SIZES.COMPACT}
                  />
                  <span className="text-sm font-medium truncate flex-1">{ws.workspaceName}</span>
                  {selectedWorkspaceId === ws.workspaceId && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAuthorize}
            disabled={isSubmitting || !selectedWorkspaceId}
            size="lg"
            className="w-full px-7 py-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              'Authorize & Connect'
            )}
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => window.close()}
            >
              Cancel
            </button>
          </div>
        </div>
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <DinoError
        title="Authorization Error"
        description={message}
        onGoBack={() => window.close()}
        showRetry={false}
      />
    </div>
  );
}
