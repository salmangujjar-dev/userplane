'use client';

import { useState, useEffect } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { useWorkspace } from '@/hooks/use-workspace';
import { useWorkspaceId } from '@/stores/workspace';
import { useUpdateWorkspaceName } from '@/queries/use-overview-mutations';
import { useRotateInvite } from '@/queries/use-workspace-mutations';
import { SectionError } from '@/components/shared/section-error';
import { ResetInviteTokenModal } from '@/components/modals/reset-invite-token-modal';
import { WorkspaceSectionSkeleton } from '@/components/skeleton';

export function WorkspaceSection() {
  const workspaceId = useWorkspaceId();
  const { data: workspaceResult, isLoading, error, refetch } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState('');
  const [resetInviteModalOpen, setResetInviteModalOpen] = useState(false);

  const workspaceData = workspaceResult?.success ? workspaceResult.data : null;
  const originalName = workspaceData?.workspace.workspaceName || '';

  useEffect(() => {
    if (workspaceData?.workspace.workspaceName) {
      setWorkspaceName(workspaceData.workspace.workspaceName);
    }
  }, [workspaceData]);

  const updateNameMutation = useUpdateWorkspaceName(workspaceId, (originalName) =>
    setWorkspaceName(originalName)
  );
  const rotateInviteMutation = useRotateInvite();

  const handleSave = () => {
    if (workspaceName.trim() && workspaceName !== originalName) {
      updateNameMutation.mutate(workspaceName.trim());
    }
  };

  const handleResetInviteToken = () => {
    setResetInviteModalOpen(true);
  };

  const handleConfirmResetInviteToken = () => {
    if (!workspaceId) return;
    rotateInviteMutation.mutate(workspaceId);
    setResetInviteModalOpen(false);
  };

  const hasChanges = workspaceName.trim() !== originalName && workspaceName.trim().length > 0;

  if (isLoading) {
    return <WorkspaceSectionSkeleton />;
  }

  if (error || (workspaceResult && !workspaceResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspace</h2>
          <p className="text-sm text-muted-foreground">Manage your workspace settings</p>
        </div>
        <div className="max-w-2xl">
          <SectionError
            title="Failed to load workspace"
            description={
              error instanceof Error
                ? error.message
                : workspaceResult && !workspaceResult.success
                  ? workspaceResult.error.message
                  : 'Something went wrong while loading workspace settings.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspace</h2>
          <p className="text-sm text-muted-foreground">Manage your workspace settings</p>
        </div>
        <div className="max-w-2xl space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <p className="text-sm text-muted-foreground mt-1">Set the name for your workspace</p>
            </div>
            <div className="flex gap-2 items-start">
              <Input
                id="workspace-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Enter workspace name"
                className="max-w-md"
                disabled={updateNameMutation.isPending}
              />
              {hasChanges && (
                <Button onClick={handleSave} disabled={updateNameMutation.isPending} size="default">
                  {updateNameMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <div className="text-sm font-medium">Reset invite token for workspace</div>
              <p className="text-sm text-muted-foreground mt-1">
                Generate a new invite token and invalidate the old one
              </p>
            </div>
            <Button
              onClick={handleResetInviteToken}
              disabled={rotateInviteMutation.isPending}
              className="ml-4"
            >
              {rotateInviteMutation.isPending ? 'Resetting...' : 'Reset'}
            </Button>
          </div>
        </div>
      </div>

      <ResetInviteTokenModal
        open={resetInviteModalOpen}
        onOpenChange={setResetInviteModalOpen}
        onConfirm={handleConfirmResetInviteToken}
        isLoading={rotateInviteMutation.isPending}
      />
    </>
  );
}
