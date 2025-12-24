'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWorkspace } from '@/hooks/use-workspace';
import { useWorkspaceStore } from '@/stores/workspace';
import { DinoError } from '@/components/shared/dino-error';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workspaceIdFromUrl = params.workspaceId as string;
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
  const clearWorkspace = useWorkspaceStore((state) => state.clearWorkspace);

  // Sync URL param to store
  useEffect(() => {
    if (workspaceIdFromUrl) {
      setWorkspace(workspaceIdFromUrl);
    }
  }, [workspaceIdFromUrl, setWorkspace]);

  const { data: workspaceResult, error } = useWorkspace();

  // Show error state only if there's an actual error
  // Check for React Query error (unknown errors) or SafeResult failure (known API errors)
  const hasError = error || (workspaceResult && !workspaceResult.success);

  if (hasError) {
    const handleGoHome = () => {
      clearWorkspace();
      window.location.href = '/';
    };

    // Determine error message from either React Query error or SafeResult error
    const errorMessage =
      error instanceof Error
        ? error.message
        : workspaceResult && !workspaceResult.success
          ? workspaceResult.error.message
          : 'This workspace may have been deleted or you may not have access.';

    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <DinoError
          title="Workspace not found"
          description={errorMessage}
          onGoBack={handleGoHome}
          showRetry={false}
          showGoBack={true}
        />
      </div>
    );
  }

  // While loading or when workspace exists, render children
  // Page-level loading.tsx will handle the loading state
  return <>{children}</>;
}
