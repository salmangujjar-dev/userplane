'use client';

import { useParams, useRouter } from 'next/navigation';

import {
  InviteEmptyState,
  InviteErrorState,
  InviteLoadingState,
  InviteTeammatesView,
} from '@/components/integrations/intercom';
import { useFirstWorkspaceDomain } from '@/features/domains';
import { useZendeskAgents } from '@/features/integrations';

export default function ZendeskInvitePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  // Fetch Zendesk agents and first domain in parallel
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

  if (teammates.length === 0) {
    return <InviteEmptyState workspaceId={workspaceId} variant="zendesk" />;
  }
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
      onComplete={() => router.push(`/workspace/${workspaceId}/recordings`)}
      onSkip={() => router.push(`/workspace/${workspaceId}/recordings`)}
    />
  );
}
