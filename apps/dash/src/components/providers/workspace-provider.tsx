'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace';

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const params = useParams();
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
  const clearWorkspace = useWorkspaceStore((state) => state.clearWorkspace);

  useEffect(() => {
    const workspaceId = params.workspaceId as string | undefined;

    if (workspaceId) {
      setWorkspace(workspaceId);
    } else {
      clearWorkspace();
    }
  }, [params.workspaceId, setWorkspace, clearWorkspace]);

  return <>{children}</>;
}
