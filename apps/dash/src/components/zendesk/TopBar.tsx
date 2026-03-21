/**
 * Top Bar location
 * Quick link creator popover with project/domain selection
 */

import { useCallback, useEffect, useState } from 'react';

import { useAgentContext } from '@/hooks/zendesk/use-agent-context';
import { useWorkspaceData } from '@/hooks/zendesk/use-workspace-data';
import { useZendeskApi } from '@/hooks/zendesk/use-zendesk-api';
import type { ErrorView } from '@/lib/zendesk/errors';
import { getErrorMessage, getErrorView } from '@/lib/zendesk/errors';

import { AccessRequestedScreen } from './AccessRequestedScreen';
import { ErrorMessage } from './ErrorMessage';
import { UserplaneIcon } from './Icons';
import { LimitExceededScreen } from './LimitExceededScreen';
import { LinkCreatorForm } from './LinkCreatorForm';
import { LinkSuccess } from './LinkSuccess';
import { ReconnectScreen } from './ReconnectScreen';
import { ScreenHeader } from './ScreenHeader';
import { SignupScreen } from './SignupScreen';

type View = 'creator' | 'success' | 'error' | ErrorView;

export function TopBar({
  workspaceId,
  dashboardUrl,
}: {
  workspaceId: string;
  dashboardUrl: string;
}) {
  const { agentEmail, isLoading: agentLoading, error: agentError } = useAgentContext();
  const api = useZendeskApi();

  const [view, setView] = useState<View>('creator');
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workspace = useWorkspaceData({ workspaceId, enabled: true });

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
    setCreatedLink(null);

    const [err, result] = await api.zendeskApp.createLink({
      query: { workspaceId },
      body: {
        projectId: workspace.selectedProject,
        domainId: workspace.selectedDomain,
        agentEmail,
      },
    });

    setIsCreating(false);

    if (err) {
      const errorView = getErrorView(err);
      if (errorView) {
        setView(errorView);
      } else {
        setError(getErrorMessage(err));
        setView('error');
      }
      return;
    }

    setCreatedLink(result.data.linkUrl);
    setView('success');
  }, [workspaceId, workspace.selectedProject, workspace.selectedDomain, agentEmail, api]);

  const handleOpenDashboard = useCallback(() => {
    const url = `${dashboardUrl}/workspace/${workspaceId}/recordings`;
    window.open(url, '_blank');
  }, [workspaceId, dashboardUrl]);

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

      {view === 'signup' && <SignupScreen agentEmail={agentEmail} dashboardUrl={dashboardUrl} />}

      {view === 'access_requested' && (
        <AccessRequestedScreen agentEmail={agentEmail} dashboardUrl={dashboardUrl} />
      )}

      {view === 'limit_exceeded' && (
        <LimitExceededScreen
          workspaceId={workspaceId}
          dashboardUrl={dashboardUrl}
          onGoBack={handleReset}
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
          onGoBack={() => {
            setError(null);
            setView('creator');
          }}
        />
      )}
    </div>
  );
}
