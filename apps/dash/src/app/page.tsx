'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useWorkspaces } from '@/features/workspace';

/**
 * Root page that intelligently redirects users based on their workspace membership
 * - If user has workspaces: redirects to the first available workspace
 * - If user has no workspaces: redirects to /workspace/suggest
 *
 * The /workspace/suggest page handles showing suggestions and redirecting to
 * /workspace/create if no suggestions are available
 *
 * This route is authenticated by proxy, ensuring only logged-in users reach here
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

    if (isWorkspacesError || !workspacesData || !workspacesData.success) {
      router.replace('/workspace/suggest');
      return;
    }

    if (workspacesData.data.workspaces && workspacesData.data.workspaces.length > 0) {
      const firstWorkspace = workspacesData.data.workspaces[0];
      if (firstWorkspace) {
        router.replace(`/workspace/${firstWorkspace.workspaceId}`);
        return;
      }
    }

    router.replace('/workspace/suggest');
  }, [isLoadingWorkspaces, isWorkspacesError, workspacesData, router]);

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
