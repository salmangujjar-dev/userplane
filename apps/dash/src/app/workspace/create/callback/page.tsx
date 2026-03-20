'use client';

import { SUPPORT_EMAIL_MAILTO } from '@userplane/shared';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { apiClient } from '@/client';
import {
  InviteErrorState,
  InviteLoadingState,
  InviteTeammatesView,
  OAuthErrorState,
  OAuthLoadingState,
} from '@/components/integrations/intercom';
import { useFirstWorkspaceDomain } from '@/features/domains';
import { useIntercomAdmins } from '@/features/integrations';
import { useInvitePolicy } from '@/features/workspace';
import { type DefinedError, handleSafeResult } from '@/lib/errors';
import { INTERCOM_APP_STORE_REDIRECT_URL } from '@/lib/intercom-install';
import { ZENDESK_MARKETPLACE_REDIRECT_URL } from '@/lib/zendesk-install';
import { useWorkspaceStore } from '@/stores/workspace';

/** Valid Intercom callback flow types */
type IntercomFlow = 'intercom-inapp' | 'intercom-marketplace';

/** Valid Zendesk callback flow types */
type ZendeskFlow = 'zendesk-inapp' | 'zendesk-marketplace';

/**
 * View shown after workspace is created to invite teammates.
 * Fetches Intercom teammates and first domain in parallel.
 * Always shows the full invite view (even with 0 teammates) so users can add people manually.
 * The flow param determines completion behavior and button labels.
 */
function PostCreationInviteView({
  workspaceId,
  flow,
}: {
  workspaceId: string;
  flow: IntercomFlow;
}) {
  const router = useRouter();
  const isMarketplace = flow === 'intercom-marketplace';

  const handleComplete = () => {
    if (isMarketplace) {
      window.location.href = INTERCOM_APP_STORE_REDIRECT_URL;
    } else {
      router.push(`/workspace/${workspaceId}`);
    }
  };

  const handleSkip = () => {
    if (isMarketplace) {
      window.location.href = INTERCOM_APP_STORE_REDIRECT_URL;
    } else {
      router.push(`/workspace/${workspaceId}/recordings`);
    }
  };

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
      completionLabel={isMarketplace ? 'Go to Intercom' : 'Go to workspace'}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}

function IntercomCallbackContent({ flow }: { flow: IntercomFlow }) {
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
    return <PostCreationInviteView workspaceId={createdWorkspace.workspaceId} flow={flow} />;
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
            window.open(SUPPORT_EMAIL_MAILTO, '_blank');
          },
        }}
      />
    );
  }

  return null;
}

/**
 * View shown after Zendesk workspace creation to invite teammates.
 * Simpler than Intercom's version - no admin import, just manual invite with skip option.
 */
function ZendeskPostCreationInviteView({
  workspaceId,
  flow,
}: {
  workspaceId: string;
  flow: ZendeskFlow;
}) {
  const router = useRouter();
  const isMarketplace = flow === 'zendesk-marketplace';

  const handleComplete = () => {
    if (isMarketplace) {
      window.location.href = ZENDESK_MARKETPLACE_REDIRECT_URL;
    } else {
      router.push(`/workspace/${workspaceId}`);
    }
  };

  const handleSkip = () => {
    if (isMarketplace) {
      window.location.href = ZENDESK_MARKETPLACE_REDIRECT_URL;
    } else {
      router.push(`/workspace/${workspaceId}/recordings`);
    }
  };

  // Fetch first domain and invite policy in parallel
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
      completionLabel={isMarketplace ? 'Go to Zendesk' : 'Go to workspace'}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}

function ZendeskCallbackContent({ flow }: { flow: ZendeskFlow }) {
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
        const [apiError, response] = await apiClient.provisioner.zendesk.callback({
          query: { code, state },
        });

        const result = handleSafeResult(apiError, response?.data ?? null);

        if (!result.success) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        if (result.data.created) {
          setWorkspaceStore(result.data.workspaceId);

          setCreatedWorkspace({
            workspaceId: result.data.workspaceId,
            workspaceName: result.data.workspaceName,
          });
          setIsLoading(false);
        } else {
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
    return <ZendeskPostCreationInviteView workspaceId={createdWorkspace.workspaceId} flow={flow} />;
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
            window.open(SUPPORT_EMAIL_MAILTO, '_blank');
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

  if (flow === 'intercom-inapp' || flow === 'intercom-marketplace') {
    return <IntercomCallbackContent flow={flow} />;
  }

  if (flow === 'zendesk-inapp' || flow === 'zendesk-marketplace') {
    return <ZendeskCallbackContent flow={flow} />;
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
