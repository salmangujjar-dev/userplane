'use client';

import { Loader2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useWorkspaces } from '@/features/workspace';

/**
 * Catch-all route that redirects /_/* paths to /{workspaceId}/*
 * For example: /_/recordings -> /{workspaceId}/recordings
 *
 * This allows users to use shorthand workspace-independent URLs that
 * automatically resolve to their first available workspace
 *
 * This route is authenticated by middleware, ensuring only logged-in users reach here
 */
export default function UnderscoreCatchAllPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Extract the catch-all path segments
  const pathSegments = params.path as string[];
  const fullPath = pathSegments ? pathSegments.join('/') : '';

  // Preserve query parameters across the redirect
  const queryString = searchParams.toString();
  const suffix = queryString ? `?${queryString}` : '';

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

    // If user has workspaces, redirect to first one with the path
    if (workspacesData.data.workspaces && workspacesData.data.workspaces.length > 0) {
      const firstWorkspace = workspacesData.data.workspaces[0];
      if (firstWorkspace) {
        router.push(`/workspace/${firstWorkspace.workspaceId}/${fullPath}${suffix}`);
      } else {
        router.push('/workspace/suggest');
      }
    } else {
      // No workspaces, redirect to suggest page
      router.push('/workspace/suggest');
    }
  }, [workspacesData, isLoadingWorkspaces, isWorkspacesError, router, fullPath, suffix]);

  // Show loading while checking workspaces
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Redirecting to your workspace...</p>
      </div>
    </div>
  );
}
