/**
 * Ticket Sidebar location
 * Shows in the ticket sidebar — mirrors Intercom's opener → link creator → success flow
 */

import { useCallback, useEffect, useState } from 'react';

import { useAgentContext } from '@/hooks/zendesk/use-agent-context';
import { useZendeskClient } from '@/hooks/zendesk/use-client';
import { useTicketContext } from '@/hooks/zendesk/use-ticket-context';
import { useWorkspaceData } from '@/hooks/zendesk/use-workspace-data';
import { getZendeskApiClient } from '@/lib/zendesk/api-client';
import type { ErrorView } from '@/lib/zendesk/errors';
import { getErrorMessage, getErrorView } from '@/lib/zendesk/errors';

import { AccessRequestedScreen } from './AccessRequestedScreen';
import { ErrorMessage } from './ErrorMessage';
import { UserplaneIcon } from './Icons';
import { LimitExceededScreen } from './LimitExceededScreen';
import { LinkCreatorForm } from './LinkCreatorForm';
import { LinkSuccess } from './LinkSuccess';
import { OpenerView } from './OpenerView';
import { ReconnectScreen } from './ReconnectScreen';
import { ScreenHeader } from './ScreenHeader';
import { SignupScreen } from './SignupScreen';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generateDefaultMessage(agentName: string | null): string {
  return agentName
    ? `${agentName} has requested a screen recording from you`
    : 'Your support team has requested a screen recording from you';
}

type View = 'opener' | 'creator' | 'success' | 'error' | ErrorView;

export function TicketSidebar({
  workspaceId,
  dashboardUrl,
}: {
  workspaceId: string;
  dashboardUrl: string;
}) {
  const client = useZendeskClient();
  const { agentEmail, agentName, isLoading: agentLoading, error: agentError } = useAgentContext();
  const {
    requester,
    ticketId,
    ticketSubject,
    ticketPriority,
    ticketType,
    ticketTags,
    isLoading: ticketLoading,
  } = useTicketContext();

  const [view, setView] = useState<View>('opener');
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState(() => generateDefaultMessage(agentName));

  const workspace = useWorkspaceData({ workspaceId, enabled: view === 'creator' });

  useEffect(() => {
    setCustomMessage(generateDefaultMessage(agentName));
  }, [agentName]);

  useEffect(() => {
    if (agentError) {
      setError(agentError);
      setView('error');
    }
  }, [agentError]);

  // Route workspace data errors to dedicated screens
  useEffect(() => {
    if (workspace.rawError) {
      const errorView = getErrorView(workspace.rawError);
      if (errorView) {
        setView(errorView);
      } else if (workspace.error) {
        setError(workspace.error);
        setView('error');
      }
    }
  }, [workspace.rawError, workspace.error]);

  const handleCreateLink = useCallback(async () => {
    if (!workspace.selectedProject) {
      setError('Please select a project.');
      setView('error');
      return;
    }
    if (!agentEmail) {
      setError('Could not resolve your email. Please reload the app.');
      setView('error');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const api = getZendeskApiClient();
      const result = await api.createLink({
        workspaceId,
        projectId: workspace.selectedProject,
        domainId: workspace.selectedDomain,
        agentEmail,
        ticketId: ticketId ?? undefined,
        ticketSubject: ticketSubject ?? undefined,
        ticketPriority: ticketPriority ?? undefined,
        ticketType: ticketType ?? undefined,
        ticketTags: ticketTags.length > 0 ? ticketTags : undefined,
        requesterName: requester?.name ?? undefined,
        requesterEmail: requester?.email ?? undefined,
        agentName: agentName ?? undefined,
      });

      if (result.success) {
        setCreatedLink(result.data.linkUrl);
        setView('success');

        const safeLink = escapeHtml(result.data.linkUrl);
        const safeMsg = escapeHtml(customMessage);
        const html = `<p>${safeMsg}</p><p><a href="${safeLink}" target="_blank">Click here to record your screen</a></p>`;
        client.invoke('comment.appendHtml', html).catch(() => {
          client.invoke('notify', 'Could not add link to comment draft', 'error');
        });

        client.invoke('ticket.tags.add', 'userplane-recording-requested').catch(() => {});
        client.invoke('notify', 'Link created and added to comment', 'notice');
      } else {
        setError('Failed to create link. Please try again.');
        setView('error');
        client.invoke('notify', 'Failed to create link', 'error');
      }
    } catch (err) {
      const errorView = getErrorView(err);
      if (errorView) {
        setView(errorView);
      } else {
        const message = getErrorMessage(err);
        setError(message);
        setView('error');
        client.invoke('notify', message, 'error');
      }
    } finally {
      setIsCreating(false);
    }
  }, [
    workspaceId,
    workspace.selectedProject,
    workspace.selectedDomain,
    ticketId,
    ticketSubject,
    ticketPriority,
    ticketType,
    ticketTags,
    requester,
    agentEmail,
    agentName,
    customMessage,
    client,
  ]);

  const handleCreateAnother = useCallback(() => {
    setCreatedLink(null);
    setError(null);
    setView('creator');
  }, []);

  const handleDone = useCallback(() => {
    setCreatedLink(null);
    setError(null);
    setView('opener');
  }, []);

  const handleViewRecordings = useCallback(() => {
    const url = `${dashboardUrl}/workspace/${workspaceId}/recordings`;
    window.open(url, '_blank');
  }, [workspaceId, dashboardUrl]);

  const handleGoBackToOpener = useCallback(() => {
    setError(null);
    setView('opener');
  }, []);

  if (ticketLoading || agentLoading) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <ScreenHeader
          icon={<UserplaneIcon size={40} />}
          title="Loading..."
          description="Connecting to your workspace"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
      {view === 'opener' && (
        <OpenerView
          onRequestRecording={() => setView('creator')}
          onViewRecordings={handleViewRecordings}
        />
      )}

      {view === 'creator' && (
        <LinkCreatorForm
          projects={workspace.projects}
          domains={workspace.domains}
          selectedProject={workspace.selectedProject}
          selectedDomain={workspace.selectedDomain}
          onProjectChange={workspace.setSelectedProject}
          onDomainChange={workspace.setSelectedDomain}
          onSubmit={handleCreateLink}
          onGoBack={() => setView('opener')}
          isCreating={isCreating}
          isLoading={workspace.isLoading}
          workspaceId={workspaceId}
          customMessage={customMessage}
          onCustomMessageChange={setCustomMessage}
        />
      )}

      {view === 'success' && createdLink && (
        <LinkSuccess
          linkUrl={createdLink}
          description="The link has been added to your reply draft."
          actions={[
            { label: 'Create another link', onClick: handleCreateAnother, variant: 'primary' },
            { label: 'Done', onClick: handleDone, variant: 'secondary' },
          ]}
        />
      )}

      {view === 'signup' && <SignupScreen agentEmail={agentEmail} dashboardUrl={dashboardUrl} />}

      {view === 'access_requested' && (
        <AccessRequestedScreen agentEmail={agentEmail} dashboardUrl={dashboardUrl} />
      )}

      {view === 'limit_exceeded' && (
        <LimitExceededScreen
          workspaceId={workspaceId}
          dashboardUrl={dashboardUrl}
          onGoBack={handleGoBackToOpener}
        />
      )}

      {view === 'reconnect' && (
        <ReconnectScreen
          agentEmail={agentEmail}
          workspaceId={workspaceId}
          dashboardUrl={dashboardUrl}
        />
      )}

      {view === 'error' && error && (
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError(null);
            setView('creator');
          }}
          onGoBack={handleGoBackToOpener}
        />
      )}
    </div>
  );
}
