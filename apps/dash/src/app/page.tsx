'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useWorkspaces } from '@/hooks/use-workspaces';

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
  const router = useRouter();

  const {
    data: workspacesData,
    isLoading: isLoadingWorkspaces,
    isError: isWorkspacesError,
  } = useWorkspaces({
    page: 1,
    perPage: 1,
  });

  useEffect(() => {
    if (isLoadingWorkspaces) return;

    // If error or no workspaces, redirect to suggest page
    if (isWorkspacesError || !workspacesData || !workspacesData.success) {
      router.push('/workspace/suggest');
      return;
    }

    // If user has workspaces, redirect to first one
    if (workspacesData.data.workspaces && workspacesData.data.workspaces.length > 0) {
      const firstWorkspace = workspacesData.data.workspaces[0];
      if (firstWorkspace) {
        router.push(`/${firstWorkspace.workspaceId}`);
      } else {
        router.push('/workspace/suggest');
      }
    } else {
      // No workspaces, redirect to suggest page
      router.push('/workspace/suggest');
    }
  }, [workspacesData, isLoadingWorkspaces, isWorkspacesError, router]);

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
