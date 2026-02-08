'use client';

import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { AppSidebar } from '@/components/navigation/sidebar';
import { WorkspaceAccessGate } from '@/components/workspace/workspace-access-gate';
import { useWorkspaceStore } from '@/stores/workspace';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workspaceIdFromUrl = params.workspaceId as string;
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

  // Full-screen views that render their own chrome (no sidebar)
  const isFullScreenView = !!params.recordingId;

  // Sync URL param to store
  useEffect(() => {
    if (workspaceIdFromUrl) {
      setWorkspace(workspaceIdFromUrl);
    }
  }, [workspaceIdFromUrl, setWorkspace]);

  if (isFullScreenView) {
    return <WorkspaceAccessGate>{children}</WorkspaceAccessGate>;
  }

  return (
    <WorkspaceAccessGate>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </WorkspaceAccessGate>
  );
}
