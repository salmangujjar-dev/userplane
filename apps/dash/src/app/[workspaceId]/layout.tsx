'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from '@workspace/ui/components/sonner';
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

  const { data: workspace, isLoading, error } = useWorkspace();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Show error state for invalid workspace
  if (error || !workspace) {
    const handleGoHome = () => {
      clearWorkspace();
      window.location.href = '/';
    };

    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <DinoError
          title="Workspace not found"
          description={
            error instanceof Error
              ? error.message
              : 'This workspace may have been deleted or you may not have access.'
          }
          onGoBack={handleGoHome}
          showRetry={false}
          showGoBack={true}
        />
      </div>
    );
  }

  return <>{children}</>;
}
