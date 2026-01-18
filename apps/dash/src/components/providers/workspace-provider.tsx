'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { useWorkspaceStore } from '@/stores/workspace';

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

/**
 * WorkspaceProvider syncs workspace ID with URL parameters
 * Clears workspace state when not in a workspace route
 */
export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const params = useParams();
  const currentWorkspaceId = useWorkspaceStore((state) => state.workspaceId);
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
  const clearWorkspace = useWorkspaceStore((state) => state.clearWorkspace);

  useEffect(() => {
    const workspaceId = params.workspaceId as string | undefined;

    if (workspaceId) {
      if (workspaceId !== currentWorkspaceId) {
        setWorkspace(workspaceId);
      }
    } else {
      if (currentWorkspaceId !== null) {
        clearWorkspace();
      }
    }
  }, [params.workspaceId, currentWorkspaceId, setWorkspace, clearWorkspace]);

  return <>{children}</>;
}
