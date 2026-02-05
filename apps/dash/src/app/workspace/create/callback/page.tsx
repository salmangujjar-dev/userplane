'use client';

import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { apiClient } from '@/client';
import {
  InviteEmptyState,
  InviteErrorState,
  InviteLoadingState,
  InviteTeammatesView,
  OAuthErrorState,
  OAuthLoadingState,
} from '@/components/integrations/intercom';
import { useFirstWorkspaceDomain } from '@/features/domains';
import { useIntercomAdmins } from '@/features/integrations';
import { type DefinedError, handleSafeResult } from '@/lib/errors';
import { useWorkspaceStore } from '@/stores/workspace';

/**
 * View shown after workspace is created to invite teammates.
 * Fetches Intercom teammates and first domain in parallel.
 */
function PostCreationInviteView({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();

  // Fetch teammates and first domain in parallel
  const {
    data: teammatesData,
    isLoading: teammatesLoading,
    error: teammatesError,
    refetch: refetchTeammates,
  } = useIntercomAdmins(workspaceId, true);

  const { data: domainsData, isLoading: domainsLoading } = useFirstWorkspaceDomain(workspaceId);

  const isLoading = teammatesLoading || domainsLoading;

  if (isLoading) {
    return <InviteLoadingState />;
  }

  if (teammatesError || !teammatesData?.success) {
    return (
      <InviteErrorState
        workspaceId={workspaceId}
        message={
          teammatesData?.success === false
            ? teammatesData.error.message
            : 'Failed to load teammates'
        }
        onRetry={() => refetchTeammates()}
      />
    );
  }

  // API already filters out @intercom.io emails
  const teammates = teammatesData.data.admins;

  if (teammates.length === 0) {
    return <InviteEmptyState workspaceId={workspaceId} />;
  }

  // Extract first domain if exists
  const firstDomain = domainsData?.success ? domainsData.data.domains[0] : null;

  return (
    <InviteTeammatesView
      workspaceId={workspaceId}
      teammates={teammates}
      invitePolicy={teammatesData.data.invitePolicy}
      allowedDomains={teammatesData.data.allowedDomains}
      initialDomainId={firstDomain?.domainId ?? null}
      initialDomainUrl={firstDomain?.domainUrl ?? ''}
      onComplete={() => router.push(`/workspace/${workspaceId}`)}
      onSkip={() => router.push(`/workspace/${workspaceId}/settings`)}
    />
  );
}

function IntercomCallbackContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DefinedError | null>(null);
  const [createdWorkspace, setCreatedWorkspace] = useState<{
    workspaceId: string;
    workspaceName: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        setError({
          defined: true,
          code: 'MISSING_PARAMS',
          status: 400,
          message: 'Missing authorization code or state parameter',
        });
        setIsLoading(false);
        return;
      }

      try {
        const [apiError, response] = await apiClient.provisioner.intercom.callback({
          query: { code, state },
        });

        const result = handleSafeResult(apiError, response?.data ?? null);

        if (!result.success) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        if (result.data.created) {
          // Set workspace in store so hooks can access it
          setWorkspaceStore(result.data.workspaceId);
          setCreatedWorkspace({
            workspaceId: result.data.workspaceId,
            workspaceName: result.data.workspaceName,
          });
          setIsLoading(false);
        } else {
          // Workspace creation failed (edge case)
          setError({
            defined: true,
            code: 'WORKSPACE_NOT_CREATED',
            status: 500,
            message: 'Failed to create workspace. Please try again.',
          });
          setIsLoading(false);
        }
      } catch (err) {
        setError({
          defined: true,
          code: 'UNKNOWN_ERROR',
          status: 500,
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
        });
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, setWorkspaceStore]);

  // Show invite view after workspace creation
  if (createdWorkspace) {
    return <PostCreationInviteView workspaceId={createdWorkspace.workspaceId} />;
  }

  // Show loading during OAuth callback processing
  if (isLoading) {
    return <OAuthLoadingState />;
  }

  // Show error if OAuth callback failed
  if (error) {
    return (
      <OAuthErrorState
        error={error}
        errorActionPrimary={{
          label: 'Configure Userplane Manually',
          callback: () => router.push('/workspace/create?flow=direct'),
        }}
        errorActionSecondary={{
          label: 'Contact Support',
          callback: () => {
            window.open('mailto:support@userplane.io', '_blank');
          },
        }}
      />
    );
  }

  return null;
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const flow = searchParams.get('flow');

  if (flow === 'intercom') {
    return <IntercomCallbackContent />;
  }

  // Invalid callback flow - redirect to create page with error
  redirect('/workspace/create?error=invalid_callback_flow');
}

export default function CreateCallbackPage() {
  return (
    <Suspense fallback={<OAuthLoadingState />}>
      <CallbackContent />
    </Suspense>
  );
}
