'use client';

import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';

import { useWorkspaces } from '@/features/workspace';

/**
 * Root page that intelligently redirects users based on their workspace membership
 * - If user has workspaces: redirects to the first available workspace
 * - If user has no workspaces: redirects to /workspace/suggest
 *
 * The /workspace/suggest page handles showing suggestions and redirecting to
 * /workspace/create if no suggestions are available
 *
 * This route is authenticated by middleware, ensuring only logged-in users reach here
 */
export default function RootPage() {
  const {
    data: workspacesData,
    isLoading: isLoadingWorkspaces,
    isError: isWorkspacesError,
  } = useWorkspaces({
    page: 1,
    perPage: 1,
  });

  // Redirect during render using Next.js redirect()
  if (!isLoadingWorkspaces) {
    if (isWorkspacesError || !workspacesData || !workspacesData.success) {
      // If error or no workspaces, redirect to suggest page
      redirect('/workspace/suggest');
    } else if (workspacesData.data.workspaces && workspacesData.data.workspaces.length > 0) {
      const firstWorkspace = workspacesData.data.workspaces[0];
      if (firstWorkspace) {
        // Redirect to first workspace
        redirect(`/workspace/${firstWorkspace.workspaceId}`);
      } else {
        redirect('/workspace/suggest');
      }
    } else {
      // No workspaces, redirect to suggest page
      redirect('/workspace/suggest');
    }
  }

  // Show loading while checking workspaces
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading your workspaces...</p>
      </div>
    </div>
  );
}
