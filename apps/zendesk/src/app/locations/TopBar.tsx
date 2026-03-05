/**
 * Top Bar location
 * Quick link creator popover with project/domain selection
 */

import type { ZendeskDomain, ZendeskProject } from '@userplane/contract';
import { useCallback, useEffect, useState } from 'react';

import { getApiClient } from '@/api/client';
import { useAgentContext } from '@/app/hooks/useAgentContext';
import { useClient } from '@/app/hooks/useClient';
import { DASHBOARD_URL } from '@/lib/constants';

export function TopBar({ workspaceId }: { workspaceId: string }) {
  const client = useClient();
  const { agentEmail, isLoading: agentLoading } = useAgentContext();

  const [projects, setProjects] = useState<ZendeskProject[]>([]);
  const [domains, setDomains] = useState<ZendeskDomain[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Resize popover
  useEffect(() => {
    client.invoke('resize', { width: '380px', height: '450px' });
  }, [client]);

  // Load data on pane activation
  useEffect(() => {
    async function loadData() {
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
        setIsLoading(false);
      }
    }

    loadData();
  }, [workspaceId]);

  const handleCreateLink = useCallback(async () => {
    if (!selectedProject || !agentEmail) return;

    setIsCreating(true);
    setError(null);
    setCreatedLink(null);

    try {
      const api = getApiClient();
      const result = await api.createLink({
        workspaceId,
        projectId: selectedProject,
        domainId: selectedDomain,
        agentEmail,
      });

      if (result.success) {
        setCreatedLink(result.data.linkUrl);
      } else {
        setError('Failed to create link');
      }
    } catch {
      setError('Failed to create link');
    } finally {
      setIsCreating(false);
    }
  }, [workspaceId, selectedProject, selectedDomain, agentEmail]);

  const handleCopy = useCallback(async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    client.invoke('notify', 'Link copied to clipboard', 'notice');
  }, [createdLink, client]);

  const handleOpenDashboard = useCallback(() => {
    const url = `${DASHBOARD_URL}/workspace/${workspaceId}/recordings`;
    window.open(url, '_blank');
  }, [workspaceId]);

  const handleReset = useCallback(() => {
    setCreatedLink(null);
    setError(null);
  }, []);

  if (isLoading || agentLoading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#68737d' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
        Create Recording Link
      </h2>

      {!createdLink ? (
        <>
          <div style={{ marginBottom: '12px' }}>
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
            <div style={{ marginBottom: '12px' }}>
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
              padding: '10px 16px',
              background: isCreating ? '#87929d' : '#1f73b7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {isCreating ? 'Creating...' : 'Create Link'}
          </button>

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
        </>
      ) : (
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
              Link created successfully
            </div>
            <div
              style={{
                padding: '8px',
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

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: '#1f73b7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Copy Link
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: 'white',
                color: '#2f3941',
                border: '1px solid #d8dcde',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Create Another
            </button>
          </div>

          <button
            onClick={handleOpenDashboard}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'white',
              color: '#1f73b7',
              border: '1px solid #1f73b7',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Open in Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
