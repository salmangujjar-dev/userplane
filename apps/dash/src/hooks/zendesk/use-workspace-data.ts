import type { ZendeskDomain, ZendeskProject } from '@userplane/contract';
import { useEffect, useState } from 'react';

import { useZendeskApi } from './use-zendesk-api';

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
  const api = useZendeskApi();
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

      const [projectsResult, domainsResult] = await Promise.all([
        api.zendeskApp.getProjects({ query: { workspaceId } }),
        api.zendeskApp.getDomains({ query: { workspaceId } }),
      ]);

      const [projectsErr, projectsRes] = projectsResult;
      const [domainsErr, domainsRes] = domainsResult;

      if (projectsErr || domainsErr) {
        const err = projectsErr || domainsErr;
        setRawError(err);
        setError(err instanceof Error ? err.message : 'Failed to load workspace data');
        setIsLoading(false);
        return;
      }

      if (projectsRes) {
        setProjects(projectsRes.data.projects);
        if (projectsRes.data.projects.length > 0 && projectsRes.data.projects[0]) {
          setSelectedProject(projectsRes.data.projects[0].id);
        }
      }
      if (domainsRes) {
        const verified = domainsRes.data.domains.filter((d) => d.verified);
        setDomains(verified);
        if (verified.length > 0 && verified[0]) {
          setSelectedDomain(verified[0].id);
        }
      }

      setIsLoading(false);
    }

    loadData();
  }, [workspaceId, enabled, api]);

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
