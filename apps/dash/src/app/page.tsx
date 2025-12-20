'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { Loader2 } from 'lucide-react';

/**
 * Root page that intelligently redirects users based on their workspace membership
 * - If user has workspaces: redirects to the first available workspace
 * - If user has no workspaces: redirects to workspace creation page
 *
 * This route is authenticated by middleware, ensuring only logged-in users reach here
 */
export default function RootPage() {
  const router = useRouter();
  const {
    data: workspacesData,
    isLoading,
    isError,
  } = useWorkspaces({
    page: 1,
    perPage: 1,
  });

  useEffect(() => {
    if (isLoading) return;

    if (isError) {
      router.push('/workspace/create');
      return;
    }

    if (workspacesData?.workspaces && workspacesData.workspaces.length > 0) {
      const firstWorkspace = workspacesData.workspaces[0];
      if (firstWorkspace) {
        router.push(`/${firstWorkspace.workspaceId}`);
      } else {
        router.push('/workspace/create');
      }
    } else {
      router.push('/workspace/create');
    }
  }, [workspacesData, isLoading, isError, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading your workspaces...</p>
      </div>
    </div>
  );
}
