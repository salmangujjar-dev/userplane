'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { WorkspaceNameSchema } from '@workspace/contract';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { BillingEmailVerificationModal } from '@/components/modals/billing-email-verification-modal';
import { SectionError } from '@/components/shared/section-error';
import { WorkspaceSectionSkeleton } from '@/components/skeleton';
import { useWorkspace } from '@/hooks/use-workspace';
import { useWorkspaceBillingEmail } from '@/hooks/use-workspace-billing-email';
import { useCanEditWorkspace } from '@/hooks/use-workspace-role';
import { useRequestBillingEmailChange } from '@/queries/use-billing-email-verification-mutations';
import { useUpdateWorkspaceName } from '@/queries/use-overview-mutations';
import { useWorkspaceId } from '@/stores/workspace';

const workspaceNameFormSchema = z.object({
  name: WorkspaceNameSchema,
});

export function WorkspaceSection() {
  const workspaceId = useWorkspaceId();
  const { data: workspaceResult, isLoading, error, refetch } = useWorkspace();
  const { data: billingEmailResult, isLoading: isLoadingBilling } = useWorkspaceBillingEmail();
  const { canEdit } = useCanEditWorkspace();
  const [showBillingModal, setShowBillingModal] = useState(false);

  const workspaceData = workspaceResult?.success ? workspaceResult.data : null;
  const originalName = workspaceData?.workspace.workspaceName || '';
  const originalBillingEmail = billingEmailResult?.success
    ? billingEmailResult.data.workspaceBillingEmail || ''
    : '';

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

  const requestBillingEmailChangeMutation = useRequestBillingEmailChange({
    onSuccess: () => {
      // Keep modal open to show success message
    },
  });

  const onSaveName = (data: { name: string }) => {
    updateNameMutation.mutate(data.name);
  };

  const handleRequestBillingEmailChange = async (email: string) => {
    if (!workspaceId) return;

    const result = await requestBillingEmailChangeMutation.mutateAsync({
      workspaceId,
      email,
    });

    if (!result.success) {
      throw new Error('Failed to send verification email');
    }
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

          {/* Billing Email Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="billing-email">Billing Email</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Invoices and billing related notifications will be sent to this email
              </p>
            </div>
            {isLoadingBilling ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-16 w-full max-w-md" />
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  id="billing-email"
                  type="email"
                  value={originalBillingEmail || 'Not set'}
                  className="max-w-md bg-muted"
                  disabled
                />
                {canEdit && (
                  <button
                    onClick={() => setShowBillingModal(true)}
                    disabled={requestBillingEmailChangeMutation.isPending}
                    className={`w-full max-w-md flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors ${
                      requestBillingEmailChangeMutation.isPending
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:border-primary/50'
                    }`}
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Update billing email</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <BillingEmailVerificationModal
            open={showBillingModal}
            onOpenChange={setShowBillingModal}
            currentEmail={originalBillingEmail}
            onRequestChange={handleRequestBillingEmailChange}
            isLoading={requestBillingEmailChangeMutation.isPending}
          />
        </div>
      </div>
    </>
  );
}
