'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useWorkspace } from '@/hooks/use-workspace';
import { useWorkspaceId } from '@/stores/workspace';
import { useUpdateWorkspaceName } from '@/queries/use-overview-mutations';
import { SectionError } from '@/components/shared/section-error';
import { WorkspaceSectionSkeleton } from '@/components/skeleton';
import { useWorkspaceBillingEmail } from '@/hooks/use-workspace-billing-email';
import { useUpdateWorkspaceBillingEmail } from '@/queries/use-workspace-billing-email-mutations';
import { useCanEditWorkspace } from '@/hooks/use-workspace-role';
import { workspaceNameSchema, billingEmailSchema } from '@/lib/validations';

const workspaceNameFormSchema = z.object({
  name: workspaceNameSchema,
});

const billingEmailFormSchema = z.object({
  email: billingEmailSchema,
});

export function WorkspaceSection() {
  const workspaceId = useWorkspaceId();
  const { data: workspaceResult, isLoading, error, refetch } = useWorkspace();
  const { data: billingEmailResult, isLoading: isLoadingBilling } = useWorkspaceBillingEmail();
  const { canEdit } = useCanEditWorkspace();

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

  // Billing Email Form
  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    reset: resetEmail,
    formState: { errors: emailErrors, isDirty: isEmailDirty, isValid: isEmailValid },
  } = useForm({
    resolver: zodResolver(billingEmailFormSchema),
    mode: 'onTouched',
    defaultValues: {
      email: originalBillingEmail,
    },
  });

  // Reset form when data loads
  useEffect(() => {
    if (workspaceData?.workspace.workspaceName) {
      resetName({ name: workspaceData.workspace.workspaceName });
    }
  }, [workspaceData, resetName]);

  useEffect(() => {
    if (billingEmailResult?.success) {
      resetEmail({ email: billingEmailResult.data.workspaceBillingEmail || '' });
    }
  }, [billingEmailResult, resetEmail]);

  const updateNameMutation = useUpdateWorkspaceName(workspaceId, (originalName) =>
    resetName({ name: originalName })
  );
  const updateBillingEmailMutation = useUpdateWorkspaceBillingEmail({
    onSuccess: () => resetEmail({ email: originalBillingEmail }),
  });

  const onSaveName = (data: { name: string }) => {
    updateNameMutation.mutate(data.name);
  };

  const onSaveBillingEmail = (data: { email: string }) => {
    if (!workspaceId) return;
    updateBillingEmailMutation.mutate({
      workspaceId,
      email: data.email,
    });
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
          <form onSubmit={handleEmailSubmit(onSaveBillingEmail)} className="space-y-4">
            <div>
              <Label htmlFor="billing-email">Billing Email</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Invoices and billing related notifications will be sent to this email
              </p>
            </div>
            {isLoadingBilling ? (
              <div className="flex gap-2 items-start">
                <Skeleton className="h-10 w-full max-w-md" />
              </div>
            ) : (
              <div className="flex gap-2 items-start flex-col">
                <div className="flex gap-2 items-start w-full">
                  <Controller
                    name="email"
                    control={emailControl}
                    render={({ field }) => (
                      <Input
                        id="billing-email"
                        type="email"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Enter billing email"
                        className="max-w-md"
                        disabled={!canEdit || updateBillingEmailMutation.isPending}
                      />
                    )}
                  />
                  {canEdit && isEmailDirty && isEmailValid && (
                    <Button
                      type="submit"
                      disabled={updateBillingEmailMutation.isPending}
                      size="default"
                    >
                      {updateBillingEmailMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </div>
                {emailErrors.email && (
                  <p className="text-sm text-destructive">{emailErrors.email.message}</p>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
