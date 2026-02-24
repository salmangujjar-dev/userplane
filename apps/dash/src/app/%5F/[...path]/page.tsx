'use client';

import { Loader2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { useWorkspaces } from '@/features/workspace';

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Redirecting to your workspace...</p>
      </div>
    </div>
  );
}

/**
 * Catch-all route that redirects /_/* paths to /{workspaceId}/*
 * For example: /_/recordings -> /{workspaceId}/recordings
 *
 * This allows users to use shorthand workspace-independent URLs that
 * automatically resolve to their first available workspace
 *
 * This route is authenticated by middleware, ensuring only logged-in users reach here
 */
function UnderscoreCatchAllContent() {
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

    if (isWorkspacesError || !workspacesData || !workspacesData.success) {
      router.replace('/workspace/suggest');
      return;
    }

    if (workspacesData.data.workspaces && workspacesData.data.workspaces.length > 0) {
      const firstWorkspace = workspacesData.data.workspaces[0];
      if (firstWorkspace) {
        router.replace(`/workspace/${firstWorkspace.workspaceId}/${fullPath}${suffix}`);
        return;
      }
    }

    router.replace('/workspace/suggest');
  }, [isLoadingWorkspaces, isWorkspacesError, workspacesData, router, fullPath, suffix]);

  // Show loading while checking workspaces
  return <LoadingFallback />;
}

export default function UnderscoreCatchAllPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnderscoreCatchAllContent />
    </Suspense>
  );
}
