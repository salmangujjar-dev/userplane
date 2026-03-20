/**
 * Ticket Sidebar location
 * Shows in the ticket sidebar — mirrors Intercom's opener → link creator → success flow
 */

import { useCallback, useEffect, useState } from 'react';

import { getApiClient } from '@/api/client';
import { ErrorMessage } from '@/app/components/ErrorMessage';
import { LinkCreatorForm } from '@/app/components/LinkCreatorForm';
import { LinkSuccess } from '@/app/components/LinkSuccess';
import { OpenerView } from '@/app/components/OpenerView';
import { RecordingRequestedBadge } from '@/app/components/RecordingRequestedBadge';
import { RequesterBanner } from '@/app/components/RequesterBanner';
import { useAgentContext } from '@/app/hooks/useAgentContext';
import { useClient } from '@/app/hooks/useClient';
import { useTicketContext } from '@/app/hooks/useTicketContext';
import { useWorkspaceData } from '@/app/hooks/useWorkspaceData';
import { DASHBOARD_URL } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

type View = 'opener' | 'creator' | 'success';

export function TicketSidebar({ workspaceId }: { workspaceId: string }) {
  const client = useClient();
  const { agentEmail, isLoading: agentLoading } = useAgentContext();
  const { requester, ticketId, ticketTags, isLoading: ticketLoading } = useTicketContext();

  const [view, setView] = useState<View>('opener');
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workspace = useWorkspaceData({ workspaceId, enabled: view === 'creator' });
  const hasRequestedRecording = ticketTags.includes('userplane-recording-requested');

  useEffect(() => {
    client.invoke('resize', { width: '100%', height: '400px' });
  }, [client]);

  const handleCreateLink = useCallback(async () => {
    if (!workspace.selectedProject || !agentEmail) return;

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
      });

      if (result.success) {
        setCreatedLink(result.data.linkUrl);
        setView('success');
        client.invoke('notify', 'Link created successfully', 'notice');
      } else {
        setError('Failed to create link');
        client.invoke('notify', 'Failed to create link', 'error');
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      client.invoke('notify', message, 'error');
    } finally {
      setIsCreating(false);
    }
  }, [
    workspaceId,
    workspace.selectedProject,
    workspace.selectedDomain,
    ticketId,
    agentEmail,
    client,
  ]);

  const handleCopy = useCallback(async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    client.invoke('notify', 'Link copied to clipboard', 'notice');
  }, [client, createdLink]);

  const handleAppendToComment = useCallback(async () => {
    if (!createdLink) return;

    const safeLink = escapeHtmlAttr(createdLink);
    const html = `<p>Please record your screen using this link: <a href="${safeLink}" target="_blank">${safeLink}</a></p>`;
    try {
      await client.invoke('comment.appendHtml', html);
      client.invoke('notify', 'Link added to comment', 'notice');
    } catch {
      client.invoke('notify', 'Failed to add link to comment', 'error');
    }
  }, [client, createdLink]);

  const handleAddTag = useCallback(async () => {
    try {
      await client.invoke('ticket.tags.add', 'userplane-recording-requested');
      client.invoke('notify', 'Tag added to ticket', 'notice');
    } catch {
      client.invoke('notify', 'Failed to add tag to ticket', 'error');
    }
  }, [client]);

  const handleCreateAnother = useCallback(() => {
    setCreatedLink(null);
    setError(null);
    setView('creator');
  }, []);

  const handleViewRecordings = useCallback(() => {
    const url = `${DASHBOARD_URL}/workspace/${workspaceId}/recordings`;
    window.open(url, '_blank');
  }, [workspaceId]);

  if (ticketLoading || agentLoading) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#68737d' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
      {requester && <RequesterBanner name={requester.name} email={requester.email} />}

      {hasRequestedRecording && <RecordingRequestedBadge />}

      {view === 'opener' && (
        <OpenerView
          onRequestRecording={() => setView('creator')}
          onViewRecordings={handleViewRecordings}
        />
      )}

      {view === 'creator' && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Create Recording Link</h3>
            <button
              onClick={() => setView('opener')}
              style={{
                background: 'none',
                border: 'none',
                color: '#68737d',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px',
              }}
            >
              Back
            </button>
          </div>

          <LinkCreatorForm
            projects={workspace.projects}
            domains={workspace.domains}
            selectedProject={workspace.selectedProject}
            selectedDomain={workspace.selectedDomain}
            onProjectChange={workspace.setSelectedProject}
            onDomainChange={workspace.setSelectedDomain}
            onSubmit={handleCreateLink}
            isCreating={isCreating}
            isLoading={workspace.isLoading}
            error={error || workspace.error}
            workspaceId={workspaceId}
          />
        </div>
      )}

      {view === 'success' && createdLink && (
        <LinkSuccess
          linkUrl={createdLink}
          actions={[
            { label: 'Add to ticket comment', onClick: handleAppendToComment, variant: 'primary' },
            { label: 'Copy link', onClick: handleCopy, variant: 'secondary' },
            { label: 'Add tag', onClick: handleAddTag, variant: 'secondary' },
            { label: 'Create another', onClick: handleCreateAnother, variant: 'ghost' },
          ]}
        />
      )}

      {view !== 'creator' && error && <ErrorMessage message={error} />}
    </div>
  );
}
