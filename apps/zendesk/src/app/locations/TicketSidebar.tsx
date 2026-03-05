/**
 * Ticket Sidebar location
 * Shows in the ticket sidebar — mirrors Intercom's opener → link creator → success flow
 */

import type { ZendeskDomain, ZendeskProject } from '@userplane/contract';
import { useCallback, useEffect, useState } from 'react';

import { getApiClient } from '@/api/client';
import { useAgentContext } from '@/app/hooks/useAgentContext';
import { useClient } from '@/app/hooks/useClient';
import { useTicketContext } from '@/app/hooks/useTicketContext';
import { DASHBOARD_URL } from '@/lib/constants';

type View = 'opener' | 'creator' | 'success';

export function TicketSidebar({ workspaceId }: { workspaceId: string }) {
  const client = useClient();
  const { agentEmail, isLoading: agentLoading } = useAgentContext();
  const { requester, ticketId, ticketTags, isLoading: ticketLoading } = useTicketContext();

  const [view, setView] = useState<View>('opener');
  const [projects, setProjects] = useState<ZendeskProject[]>([]);
  const [domains, setDomains] = useState<ZendeskDomain[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const hasRequestedRecording = ticketTags.includes('userplane-recording-requested');

  // Auto-resize
  useEffect(() => {
    client.invoke('resize', { width: '100%', height: '400px' });
  }, [client]);

  // Load projects and domains when entering creator view
  useEffect(() => {
    if (view !== 'creator') return;

    async function loadData() {
      setDataLoading(true);
      try {
        const api = getApiClient();
        const [projectsRes, domainsRes] = await Promise.all([
          api.getProjects(workspaceId),
          api.getDomains(workspaceId),
        ]);

        if (projectsRes.success) {
          setProjects(projectsRes.data.projects);
          if (projectsRes.data.projects.length > 0 && projectsRes.data.projects[0]) {
            setSelectedProject(projectsRes.data.projects[0].id);
          }
        }
        if (domainsRes.success) {
          const verified = domainsRes.data.domains.filter((d) => d.verified);
          setDomains(verified);
          if (verified.length > 0 && verified[0]) {
            setSelectedDomain(verified[0].id);
          }
        }
      } catch {
        setError('Failed to load workspace data');
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [workspaceId, view]);

  const handleCreateLink = useCallback(async () => {
    if (!selectedProject || !agentEmail) return;

    setIsCreating(true);
    setError(null);

    try {
      const api = getApiClient();
      const result = await api.createLink({
        workspaceId,
        projectId: selectedProject,
        domainId: selectedDomain,
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
    } catch {
      setError('Failed to create link');
      client.invoke('notify', 'Failed to create link', 'error');
    } finally {
      setIsCreating(false);
    }
  }, [workspaceId, selectedProject, selectedDomain, ticketId, agentEmail, client]);

  const handleAppendToComment = useCallback(async () => {
    if (!createdLink) return;

    const html = `<p>Please record your screen using this link: <a href="${createdLink}" target="_blank">${createdLink}</a></p>`;
    await client.invoke('comment.appendHtml', html);
    client.invoke('notify', 'Link added to comment', 'notice');
  }, [client, createdLink]);

  const handleAddTag = useCallback(async () => {
    await client.invoke('ticket.tags.add', 'userplane-recording-requested');
    client.invoke('notify', 'Tag added to ticket', 'notice');
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
      {requester && (
        <div
          style={{
            marginBottom: '16px',
            padding: '8px',
            background: '#f8f9f9',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#68737d' }}>Requester</div>
          <div style={{ fontWeight: 500 }}>{requester.name || requester.email}</div>
        </div>
      )}

      {hasRequestedRecording && (
        <div
          style={{
            marginBottom: '12px',
            padding: '6px 8px',
            background: '#fff7ed',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#92400e',
          }}
        >
          Recording already requested for this ticket
        </div>
      )}

      {/* Opener view — two action buttons */}
      {view === 'opener' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setView('creator')}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#1f73b7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Request screen recording
          </button>
          <button
            onClick={handleViewRecordings}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'white',
              color: '#1f73b7',
              border: '1px solid #1f73b7',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            View recordings
          </button>
        </div>
      )}

      {/* Creator view — project/domain form */}
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

          {dataLoading ? (
            <div style={{ textAlign: 'center', color: '#68737d', padding: '16px' }}>Loading...</div>
          ) : (
            <>
              <div style={{ marginBottom: '8px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#68737d',
                    marginBottom: '4px',
                  }}
                >
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d8dcde',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {domains.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#68737d',
                      marginBottom: '4px',
                    }}
                  >
                    Domain
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d8dcde',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.url}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleCreateLink}
                disabled={isCreating || !selectedProject}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  background: isCreating ? '#87929d' : '#1f73b7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {isCreating ? 'Creating...' : 'Create Link'}
              </button>
            </>
          )}

          {error && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                background: '#fff0f1',
                color: '#cc3340',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}

      {/* Success view — link created */}
      {view === 'success' && createdLink && (
        <div>
          <div
            style={{
              padding: '12px',
              background: '#edf8f4',
              borderRadius: '4px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#038153',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              Link created
            </div>
            <div
              style={{
                padding: '6px 8px',
                background: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                wordBreak: 'break-all',
                border: '1px solid #d1e8df',
              }}
            >
              {createdLink}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleAppendToComment}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f73b7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Add to ticket comment
            </button>
            <button
              onClick={handleAddTag}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'white',
                color: '#1f73b7',
                border: '1px solid #1f73b7',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Add tag
            </button>
            <button
              onClick={handleCreateAnother}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'white',
                color: '#2f3941',
                border: '1px solid #d8dcde',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Create another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
