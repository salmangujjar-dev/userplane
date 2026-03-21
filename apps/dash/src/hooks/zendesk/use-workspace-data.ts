import type { ZendeskDomain, ZendeskProject } from '@userplane/contract';
import { useEffect, useState } from 'react';

import { getZendeskApiClient, ZendeskApiError } from '@/lib/zendesk/api-client';

interface UseWorkspaceDataArgs {
  workspaceId: string;
  enabled: boolean;
}

interface UseWorkspaceDataReturn {
  projects: ZendeskProject[];
  domains: ZendeskDomain[];
  selectedProject: string;
  selectedDomain: string;
  setSelectedProject: (id: string) => void;
  setSelectedDomain: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  /** The raw error object, preserved for view routing */
  rawError: unknown;
}

export function useWorkspaceData({
  workspaceId,
  enabled,
}: UseWorkspaceDataArgs): UseWorkspaceDataReturn {
  const [projects, setProjects] = useState<ZendeskProject[]>([]);
  const [domains, setDomains] = useState<ZendeskDomain[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);

  useEffect(() => {
    if (!enabled) return;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      setRawError(null);

      try {
        const api = getZendeskApiClient();
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
      } catch (err) {
        setRawError(err);
        if (err instanceof ZendeskApiError && err.status === 401) {
          setError('Integration disconnected. Reconnect from the Userplane dashboard.');
        } else {
          setError('Failed to load workspace data');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [workspaceId, enabled]);

  return {
    projects,
    domains,
    selectedProject,
    selectedDomain,
    setSelectedProject,
    setSelectedDomain,
    isLoading,
    error,
    rawError,
  };
}
