'use client';

import { useParams, useRouter } from 'next/navigation';

import {
  InviteEmptyState,
  InviteErrorState,
  InviteLoadingState,
  InviteTeammatesView,
} from '@/components/integrations/intercom';
import { useFirstWorkspaceDomain } from '@/features/domains';
import { useIntercomAdmins } from '@/features/integrations';

export default function IntercomInvitePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

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
      onComplete={() => router.push(`/workspace/${workspaceId}/settings`)}
      onSkip={() => router.push(`/workspace/${workspaceId}/settings`)}
    />
  );
}
