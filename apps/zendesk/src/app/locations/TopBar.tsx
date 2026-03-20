/**
 * Top Bar location
 * Quick link creator popover with project/domain selection
 */

import { useCallback, useEffect, useState } from 'react';

import { getApiClient } from '@/api/client';
import { ErrorMessage } from '@/app/components/ErrorMessage';
import { UserplaneIcon } from '@/app/components/Icons';
import { LinkCreatorForm } from '@/app/components/LinkCreatorForm';
import { LinkSuccess } from '@/app/components/LinkSuccess';
import { ScreenHeader } from '@/app/components/ScreenHeader';
import { useAgentContext } from '@/app/hooks/useAgentContext';
import { useClient } from '@/app/hooks/useClient';
import { useWorkspaceData } from '@/app/hooks/useWorkspaceData';
import { DASHBOARD_URL } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';

type View = 'creator' | 'success' | 'error';

export function TopBar({ workspaceId }: { workspaceId: string }) {
  const client = useClient();
  const { agentEmail, isLoading: agentLoading, error: agentError } = useAgentContext();

  const [view, setView] = useState<View>('creator');
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workspace = useWorkspaceData({ workspaceId, enabled: true });

  // Show error view if agent context failed
  useEffect(() => {
    if (agentError) {
      setError(agentError);
      setView('error');
    }
  }, [agentError]);

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
        setView('success');
      } else {
        setError('Failed to create link. Please try again.');
        setView('error');
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setView('error');
    } finally {
      setIsCreating(false);
    }
  }, [workspaceId, workspace.selectedProject, workspace.selectedDomain, agentEmail]);

  const handleOpenDashboard = useCallback(() => {
    const url = `${DASHBOARD_URL}/workspace/${workspaceId}/recordings`;
    window.open(url, '_blank');
  }, [workspaceId]);

  const handleReset = useCallback(() => {
    setCreatedLink(null);
    setError(null);
    setView('creator');
  }, []);

  if (workspace.isLoading || agentLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <ScreenHeader
          icon={<UserplaneIcon size={40} />}
          title="Loading..."
          description="Fetching your workspace data"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
      {view === 'creator' && (
        <>
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
            workspaceId={workspaceId}
          />
        </>
      )}

      {view === 'success' && createdLink && (
        <LinkSuccess
          linkUrl={createdLink}
          description="Copy or share the recording link."
          actions={[
            { label: 'Create another', onClick: handleReset, variant: 'primary' },
            { label: 'Open in Dashboard', onClick: handleOpenDashboard, variant: 'secondary' },
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
            setView('creator');
          }}
        />
      )}
    </div>
  );
}
