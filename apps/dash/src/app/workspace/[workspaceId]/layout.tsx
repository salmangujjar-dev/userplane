'use client';

import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';
import { useParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { AppSidebar } from '@/components/navigation/sidebar';
import { UpsellProvider } from '@/components/providers/upsell-provider';
import { WorkspaceAccessGate } from '@/components/workspace/workspace-access-gate';
import { useWorkspaceStore } from '@/stores/workspace';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceIdFromUrl = params.workspaceId as string;
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

  // Full-screen views that render their own chrome (no sidebar)
  const isFullScreenView = !!params.recordingId || pathname.includes('/settings/integrations');

  // Sync URL param to store after render
  useEffect(() => {
    if (workspaceIdFromUrl) {
      setWorkspace(workspaceIdFromUrl);
    }
  }, [workspaceIdFromUrl, setWorkspace]);

  if (isFullScreenView) {
    return (
      <WorkspaceAccessGate>
        <UpsellProvider>{children}</UpsellProvider>
      </WorkspaceAccessGate>
    );
  }

  return (
    <WorkspaceAccessGate>
      <UpsellProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </UpsellProvider>
    </WorkspaceAccessGate>
  );
}
