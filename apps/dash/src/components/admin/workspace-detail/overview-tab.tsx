'use client';

import type { AdminNotifyDuration } from '@workspace/contract';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useState } from 'react';

import { AdminDeactivateWorkspaceModal } from '@/components/modals/admin-deactivate-workspace-modal';
import { ResetInviteTokenModal } from '@/components/modals/reset-invite-token-modal';
import { useAdminDeactivateWorkspace, useAdminResetInviteToken } from '@/features/admin';

import type { WorkspaceDetail, WorkspaceToDeactivate, WorkspaceToResetToken } from './types';

interface OverviewTabProps {
  workspaceId: string;
  workspaceDetail: WorkspaceDetail | null;
  isLoading: boolean;
}

export function OverviewTab({ workspaceId, workspaceDetail, isLoading }: OverviewTabProps) {
  const [workspaceToDeactivate, setWorkspaceToDeactivate] = useState<WorkspaceToDeactivate | null>(
    null
  );
  const [workspaceToResetToken, setWorkspaceToResetToken] = useState<WorkspaceToResetToken | null>(
    null
  );

  const deactivateMutation = useAdminDeactivateWorkspace();
  const resetTokenMutation = useAdminResetInviteToken();

  const handleDeactivate = () => {
    if (workspaceDetail) {
      setWorkspaceToDeactivate({ workspaceId, workspaceName: workspaceDetail.workspaceName });
    }
  };

  const confirmDeactivate = (notify?: AdminNotifyDuration) => {
    if (workspaceToDeactivate) {
      deactivateMutation.mutate(
        { workspaceId: workspaceToDeactivate.workspaceId, notify },
        { onSuccess: () => setWorkspaceToDeactivate(null) }
      );
    }
  };

  const handleResetInviteToken = () => {
    if (workspaceDetail) {
      setWorkspaceToResetToken({ workspaceId, workspaceName: workspaceDetail.workspaceName });
    }
  };

  const confirmResetInviteToken = () => {
    if (workspaceToResetToken) {
      resetTokenMutation.mutate(
        { workspaceId: workspaceToResetToken.workspaceId },
        { onSuccess: () => setWorkspaceToResetToken(null) }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!workspaceDetail) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <div>
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <p className="text-sm text-muted-foreground mt-1">The name of the workspace</p>
          </div>
          <Input
            id="workspace-name"
            value={workspaceDetail.workspaceName}
            readOnly
            disabled
            className="max-w-md bg-muted cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <div>
            <Label htmlFor="workspace-status">Workspace Status</Label>
            <p className="text-sm text-muted-foreground mt-1">Current status of the workspace</p>
          </div>
          <Input
            id="workspace-status"
            value={workspaceDetail.isDeleted ? 'Deactivated' : 'Active'}
            readOnly
            disabled
            className="max-w-md bg-muted cursor-not-allowed"
          />
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
            disabled={workspaceDetail.isDeleted}
            className="ml-4 w-28"
          >
            Reset
          </Button>
        </div>

        {!workspaceDetail.isDeleted && (
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <div className="text-sm font-medium">Deactivate workspace</div>
              <p className="text-sm text-muted-foreground mt-1">
                Disable this workspace and prevent all access
              </p>
            </div>
            <Button onClick={handleDeactivate} className="ml-4 w-28">
              Deactivate
            </Button>
          </div>
        )}
      </div>

      <AdminDeactivateWorkspaceModal
        open={!!workspaceToDeactivate}
        onOpenChange={(open) => !open && setWorkspaceToDeactivate(null)}
        workspace={workspaceToDeactivate}
        onConfirm={confirmDeactivate}
        isPending={deactivateMutation.isPending}
      />

      <ResetInviteTokenModal
        open={!!workspaceToResetToken}
        onOpenChange={(open) => !open && setWorkspaceToResetToken(null)}
        workspace={workspaceToResetToken}
        onConfirm={confirmResetInviteToken}
        isPending={resetTokenMutation.isPending}
      />
    </>
  );
}
