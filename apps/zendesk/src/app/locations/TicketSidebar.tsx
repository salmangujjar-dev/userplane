/**
 * Ticket Sidebar location
 * Shows in the ticket sidebar — mirrors Intercom's opener → link creator → success flow
 */

import { useCallback, useEffect, useState } from 'react';

import { getApiClient } from '@/api/client';
import { ErrorMessage } from '@/app/components/ErrorMessage';
import { UserplaneIcon } from '@/app/components/Icons';
import { LinkCreatorForm } from '@/app/components/LinkCreatorForm';
import { LinkSuccess } from '@/app/components/LinkSuccess';
import { OpenerView } from '@/app/components/OpenerView';
import { ScreenHeader } from '@/app/components/ScreenHeader';
import { useAgentContext } from '@/app/hooks/useAgentContext';
import { useClient } from '@/app/hooks/useClient';
import { useTicketContext } from '@/app/hooks/useTicketContext';
import { useWorkspaceData } from '@/app/hooks/useWorkspaceData';
import { DASHBOARD_URL } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';

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

type View = 'opener' | 'creator' | 'success' | 'error';

export function TicketSidebar({ workspaceId }: { workspaceId: string }) {
  const client = useClient();
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

  // Update default message when agent name loads
  useEffect(() => {
    setCustomMessage(generateDefaultMessage(agentName));
  }, [agentName]);

  // Show error view if agent context failed
  useEffect(() => {
    if (agentError) {
      setError(agentError);
      setView('error');
    }
  }, [agentError]);

  useEffect(() => {
    const resize = () => client.invoke('resize', { width: '100%', height: '400px' });
    resize();
    client.on('app.activated', resize);
    return () => {
      client.off('app.activated', resize);
    };
  }, [client]);

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
      const api = getApiClient();
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

        // Auto-append to ticket comment
        const safeLink = escapeHtml(result.data.linkUrl);
        const safeMsg = escapeHtml(customMessage);
        const html = `<p>${safeMsg}: <a href="${safeLink}" target="_blank">${safeLink}</a></p>`;
        client.invoke('comment.appendHtml', html).catch(() => {
          client.invoke('notify', 'Could not add link to comment draft', 'error');
        });

        // Auto-tag the ticket
        client.invoke('ticket.tags.add', 'userplane-recording-requested').catch(() => {});

        client.invoke('notify', 'Link created and added to comment', 'notice');
      } else {
        setError('Failed to create link. Please try again.');
        setView('error');
        client.invoke('notify', 'Failed to create link', 'error');
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      setView('error');
      client.invoke('notify', message, 'error');
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
    const url = `${DASHBOARD_URL}/workspace/${workspaceId}/recordings`;
    window.open(url, '_blank');
  }, [workspaceId]);

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
        <div>
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
        </div>
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

      {view === 'error' && error && (
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError(null);
            setView('creator');
          }}
          onGoBack={() => {
            setError(null);
            setView('opener');
          }}
        />
      )}
    </div>
  );
}
