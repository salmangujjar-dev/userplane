'use client';

import { useParams, useRouter } from 'next/navigation';

import {
  InviteEmptyState,
  InviteErrorState,
  InviteLoadingState,
  InviteTeammatesView,
} from '@/components/integrations/intercom';
import { useFirstWorkspaceDomain } from '@/features/domains';
import { useSlackMembers } from '@/features/integrations';

export default function SlackInvitePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  // Fetch Slack members and first domain in parallel
  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useSlackMembers(workspaceId, true);

  const { data: domainsData, isLoading: domainsLoading } = useFirstWorkspaceDomain(workspaceId);

  const isLoading = membersLoading || domainsLoading;

  if (isLoading) {
    return <InviteLoadingState variant="slack" />;
  }

  if (membersError || !membersData?.success) {
    return (
      <InviteErrorState
        workspaceId={workspaceId}
        variant="slack"
        message={
          membersData?.success === false ? membersData.error.message : 'Failed to load teammates'
        }
        onRetry={() => refetchMembers()}
      />
    );
  }

  const teammates = membersData.data.members;

  if (teammates.length === 0) {
    return <InviteEmptyState workspaceId={workspaceId} variant="slack" />;
  }

  const firstDomain = domainsData?.success ? domainsData.data.domains[0] : null;

  return (
    <InviteTeammatesView
      workspaceId={workspaceId}
      teammates={teammates}
      invitePolicy={membersData.data.invitePolicy}
      allowedDomains={membersData.data.allowedDomains}
      initialDomainId={firstDomain?.domainId ?? null}
      initialDomainUrl={firstDomain?.domainUrl ?? ''}
      variant="slack"
      onComplete={() => router.push(`/workspace/${workspaceId}/recordings`)}
      onSkip={() => router.push(`/workspace/${workspaceId}/recordings`)}
    />
  );
}
