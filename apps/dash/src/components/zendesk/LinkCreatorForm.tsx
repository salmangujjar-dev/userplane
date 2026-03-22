import type { ZendeskDomain, ZendeskProject } from '@userplane/contract';

import { env } from '@/env';

const DASHBOARD_URL = env.dashboard.url;

import { UserplaneIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

interface LinkCreatorFormProps {
  projects: ZendeskProject[];
  domains: ZendeskDomain[];
  selectedProject: string;
  selectedDomain: string;
  onProjectChange: (id: string) => void;
  onDomainChange: (id: string) => void;
  onSubmit: () => void;
  onGoBack?: () => void;
  isCreating: boolean;
  isLoading: boolean;
  workspaceId: string;
  customMessage?: string;
  onCustomMessageChange?: (msg: string) => void;
  /** Hide the header icon/title/description for compact locations like ticket_editor */
  compact?: boolean;
}

export function LinkCreatorForm({
  projects,
  domains,
  selectedProject,
  selectedDomain,
  onProjectChange,
  onDomainChange,
  onSubmit,
  onGoBack,
  isCreating,
  isLoading,
  workspaceId,
  customMessage,
  onCustomMessageChange,
  compact = false,
}: LinkCreatorFormProps) {
  if (isLoading) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <ScreenHeader
          icon={<UserplaneIcon size={40} />}
          title="Loading..."
          description="Fetching your workspace data"
        />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <ScreenHeader
          icon={<UserplaneIcon size={40} />}
          title="No projects found"
          description="Create a project in your Userplane dashboard to get started."
        />
        <a
          href={`${DASHBOARD_URL}/workspace/${workspaceId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: 'white',
            color: '#2f3941',
            border: '1px solid #d8dcde',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Open Dashboard
        </a>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <ScreenHeader
          icon={<UserplaneIcon size={40} />}
          title="Create recording link"
          description={
            compact ? undefined : 'Select a project and send a recording request to your customer.'
          }
        />
      </div>

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
          onChange={(e) => onProjectChange(e.target.value)}
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
            onChange={(e) => onDomainChange(e.target.value)}
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

      {customMessage !== undefined && onCustomMessageChange && (
        <div style={{ marginBottom: '8px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#68737d',
              marginBottom: '4px',
            }}
          >
            Message to customer
          </label>
          <input
            type="text"
            value={customMessage}
            onChange={(e) => onCustomMessageChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d8dcde',
              borderRadius: '4px',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onSubmit}
          disabled={isCreating || !selectedProject}
          style={{
            width: '100%',
            padding: '8px 16px',
            background: isCreating ? '#87929d' : '#000',
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

        {onGoBack && (
          <button
            onClick={onGoBack}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'white',
              color: '#2f3941',
              border: '1px solid #d8dcde',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Go back
          </button>
        )}
      </div>
    </>
  );
}
