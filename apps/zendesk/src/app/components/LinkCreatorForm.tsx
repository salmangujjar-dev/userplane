import type { ZendeskDomain, ZendeskProject } from '@userplane/contract';

import { DASHBOARD_URL } from '@/lib/constants';

import { ErrorMessage } from './ErrorMessage';

interface LinkCreatorFormProps {
  projects: ZendeskProject[];
  domains: ZendeskDomain[];
  selectedProject: string;
  selectedDomain: string;
  onProjectChange: (id: string) => void;
  onDomainChange: (id: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
  isLoading: boolean;
  error: string | null;
  workspaceId: string;
}

export function LinkCreatorForm({
  projects,
  domains,
  selectedProject,
  selectedDomain,
  onProjectChange,
  onDomainChange,
  onSubmit,
  isCreating,
  isLoading,
  error,
  workspaceId,
}: LinkCreatorFormProps) {
  if (isLoading) {
    return <div style={{ textAlign: 'center', color: '#68737d', padding: '16px' }}>Loading...</div>;
  }

  if (projects.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '16px',
          color: '#68737d',
          fontSize: '13px',
        }}
      >
        <p style={{ marginBottom: '8px' }}>No projects found.</p>
        <a
          href={`${DASHBOARD_URL}/workspace/${workspaceId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1f73b7', textDecoration: 'underline' }}
        >
          Configure your workspace in the Userplane dashboard
        </a>
      </div>
    );
  }

  return (
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

      <button
        onClick={onSubmit}
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

      {error && <ErrorMessage message={error} />}
    </>
  );
}
