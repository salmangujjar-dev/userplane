'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { WorkspaceAccessGate } from '@/components/workspace/workspace-access-gate';
import { useWorkspaceStore } from '@/stores/workspace';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workspaceIdFromUrl = params.workspaceId as string;
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

  // Sync URL param to store
  useEffect(() => {
    if (workspaceIdFromUrl) {
      setWorkspace(workspaceIdFromUrl);
    }
  }, [workspaceIdFromUrl, setWorkspace]);

  return <WorkspaceAccessGate>{children}</WorkspaceAccessGate>;
}
