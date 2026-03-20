/**
 * Top Bar location
 * Quick link creator popover with project/domain selection
 */

import { useCallback, useEffect, useState } from 'react';

import { getApiClient } from '@/api/client';
import { LinkCreatorForm } from '@/app/components/LinkCreatorForm';
import { LinkSuccess } from '@/app/components/LinkSuccess';
import { useAgentContext } from '@/app/hooks/useAgentContext';
import { useClient } from '@/app/hooks/useClient';
import { useWorkspaceData } from '@/app/hooks/useWorkspaceData';
import { DASHBOARD_URL } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';

export function TopBar({ workspaceId }: { workspaceId: string }) {
  const client = useClient();
  const { agentEmail, isLoading: agentLoading, error: agentError } = useAgentContext();

  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workspace = useWorkspaceData({ workspaceId, enabled: true });

  // Resize popover
  useEffect(() => {
    const resize = () => client.invoke('resize', { width: '380px', height: '450px' });
    resize();
    client.on('app.activated', resize);
    return () => {
      client.off('app.activated', resize);
    };
  }, [client]);

  const handleCreateLink = useCallback(async () => {
    if (!workspace.selectedProject) {
      setError('Please select a project.');
      return;
    }
    if (!agentEmail) {
      setError('Could not resolve your email. Please reload the app.');
      return;
    }

    setIsCreating(true);
    setError(null);
    setCreatedLink(null);

    try {
      const api = getApiClient();
      const result = await api.createLink({
        workspaceId,
        projectId: workspace.selectedProject,
        domainId: workspace.selectedDomain,
        agentEmail,
      });

      if (result.success) {
        setCreatedLink(result.data.linkUrl);
      } else {
        setError('Failed to create link');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  }, [workspaceId, workspace.selectedProject, workspace.selectedDomain, agentEmail]);

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

  if (workspace.isLoading || agentLoading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#68737d' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
        Create Recording Link
      </h2>

      {!createdLink ? (
        <LinkCreatorForm
          projects={workspace.projects}
          domains={workspace.domains}
          selectedProject={workspace.selectedProject}
          selectedDomain={workspace.selectedDomain}
          onProjectChange={workspace.setSelectedProject}
          onDomainChange={workspace.setSelectedDomain}
          onSubmit={handleCreateLink}
          isCreating={isCreating}
          isLoading={false}
          error={error || agentError || workspace.error}
          workspaceId={workspaceId}
        />
      ) : (
        <LinkSuccess
          linkUrl={createdLink}
          actions={[
            { label: 'Copy Link', onClick: handleCopy, variant: 'primary' },
            { label: 'Create Another', onClick: handleReset, variant: 'ghost' },
            { label: 'Open in Dashboard', onClick: handleOpenDashboard, variant: 'secondary' },
          ]}
        />
      )}
    </div>
  );
}
