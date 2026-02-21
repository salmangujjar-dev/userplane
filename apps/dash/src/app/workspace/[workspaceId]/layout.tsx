'use client';

import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { useParams, usePathname } from 'next/navigation';
import { useRef } from 'react';

import { AppSidebar } from '@/components/navigation/sidebar';
import { WorkspaceAccessGate } from '@/components/workspace/workspace-access-gate';
import { useWorkspaceStore } from '@/stores/workspace';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceIdFromUrl = params.workspaceId as string;
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

  // Full-screen views that render their own chrome (no sidebar)
  const isFullScreenView = !!params.recordingId || pathname.includes('/settings/integrations');

  // Sync URL param to store (adjust state during render)
  const prevWorkspaceIdRef = useRef<string | undefined>(undefined);
  if (workspaceIdFromUrl && workspaceIdFromUrl !== prevWorkspaceIdRef.current) {
    setWorkspace(workspaceIdFromUrl);
  }
  prevWorkspaceIdRef.current = workspaceIdFromUrl;

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
