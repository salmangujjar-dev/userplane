'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { LeaveWorkspaceModal } from '@/components/modals/leave-workspace-modal';
import { SectionError } from '@/components/shared/section-error';
import { WorkspaceSectionSkeleton } from '@/components/skeleton';
import {
  useCanEditWorkspace,
  useLeaveWorkspace,
  useUpdateWorkspaceName,
  useWorkspace,
} from '@/features/workspace';
import { WorkspaceNameSchema } from '@/schemas';
import { useWorkspaceId } from '@/stores/workspace';

const workspaceNameFormSchema = z.object({
  name: WorkspaceNameSchema,
});

export function WorkspaceSection() {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { data: workspaceResult, isLoading, error, refetch } = useWorkspace();
  const { canEdit, role } = useCanEditWorkspace();
  const [leaveWorkspaceModalOpen, setLeaveWorkspaceModalOpen] = useState(false);

  const workspaceData = workspaceResult?.success ? workspaceResult.data : null;
  const originalName = workspaceData?.workspace.workspaceName || '';
  const workspaceName = workspaceData?.workspace.workspaceName || '';
  const isOwner = role === 'owner';

  const leaveWorkspaceMutation = useLeaveWorkspace(workspaceId, (path) => router.push(path));

  // Workspace Name Form
  const {
    control: nameControl,
    handleSubmit: handleNameSubmit,
    reset: resetName,
    formState: { errors: nameErrors, isDirty: isNameDirty, isValid: isNameValid },
  } = useForm({
    resolver: zodResolver(workspaceNameFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: originalName,
    },
  });

  // Reset form when data loads
  useEffect(() => {
    if (workspaceData?.workspace.workspaceName) {
      resetName({ name: workspaceData.workspace.workspaceName });
    }
  }, [workspaceData, resetName]);

  const updateNameMutation = useUpdateWorkspaceName(workspaceId, (originalName) =>
    resetName({ name: originalName })
  );

  const onSaveName = (data: { name: string }) => {
    updateNameMutation.mutate(data.name);
  };

  const handleLeaveWorkspace = () => {
    setLeaveWorkspaceModalOpen(true);
  };

  const handleConfirmLeaveWorkspace = () => {
    if (!workspaceId) return;
    leaveWorkspaceMutation.mutate(workspaceId);
    setLeaveWorkspaceModalOpen(false);
  };

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
          <form onSubmit={handleNameSubmit(onSaveName)} className="space-y-4">
            <div>
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <p className="text-sm text-muted-foreground mt-1">Set the name for your workspace</p>
            </div>
            <div className="flex gap-2 items-start flex-col">
              <div className="flex gap-2 items-start w-full">
                <Controller
                  name="name"
                  control={nameControl}
                  render={({ field }) => (
                    <Input
                      id="workspace-name"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Enter workspace name"
                      className="max-w-md"
                      disabled={!canEdit || updateNameMutation.isPending}
                    />
                  )}
                />
                {canEdit && isNameDirty && isNameValid && (
                  <Button type="submit" disabled={updateNameMutation.isPending} size="default">
                    {updateNameMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                )}
              </div>
              {nameErrors.name && (
                <p className="text-sm text-destructive">{nameErrors.name.message}</p>
              )}
            </div>
          </form>

          {/* Leave Workspace */}
          <div className="space-y-3">
            <div>
              <Label>Leave workspace</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {isOwner
                  ? 'Leave and deactivate this workspace if you are the only member'
                  : 'Remove yourself from this workspace'}
              </p>
            </div>
            <button
              onClick={handleLeaveWorkspace}
              disabled={leaveWorkspaceMutation.isPending}
              className={`w-full max-w-md flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors ${
                leaveWorkspaceMutation.isPending
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:border-destructive/50'
              }`}
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {leaveWorkspaceMutation.isPending ? 'Leaving...' : 'Leave workspace'}
              </span>
            </button>
          </div>

          <LeaveWorkspaceModal
            open={leaveWorkspaceModalOpen}
            onOpenChange={setLeaveWorkspaceModalOpen}
            workspaceName={workspaceName}
            isOwner={isOwner}
            onConfirm={handleConfirmLeaveWorkspace}
            isLoading={leaveWorkspaceMutation.isPending}
          />
        </div>
      </div>
    </>
  );
}
