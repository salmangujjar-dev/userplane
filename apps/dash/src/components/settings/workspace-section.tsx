'use client';

import { useState, useEffect } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { useWorkspace } from '@/hooks/use-workspace';
import { useWorkspaceId } from '@/stores/workspace';
import { useUpdateWorkspaceName } from '@/queries/use-overview-mutations';
import { SectionError } from '@/components/shared/section-error';
import { WorkspaceSectionSkeleton } from '@/components/skeleton';
import { useWorkspaceBillingEmail } from '@/hooks/use-workspace-billing-email';
import { useUpdateWorkspaceBillingEmail } from '@/queries/use-workspace-billing-email-mutations';
import { useCanEditWorkspace } from '@/hooks/use-workspace-role';

export function WorkspaceSection() {
  const workspaceId = useWorkspaceId();
  const { data: workspaceResult, isLoading, error, refetch } = useWorkspace();
  const { data: billingEmailResult, isLoading: isLoadingBilling } = useWorkspaceBillingEmail();
  const { canEdit } = useCanEditWorkspace();

  const [workspaceName, setWorkspaceName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [hasBillingEmailChanges, setHasBillingEmailChanges] = useState(false);

  const workspaceData = workspaceResult?.success ? workspaceResult.data : null;
  const originalName = workspaceData?.workspace.workspaceName || '';

  useEffect(() => {
    if (workspaceData?.workspace.workspaceName) {
      setWorkspaceName(workspaceData.workspace.workspaceName);
    }
  }, [workspaceData]);

  useEffect(() => {
    if (billingEmailResult?.success) {
      setBillingEmail(billingEmailResult.data.workspaceBillingEmail || '');
      setHasBillingEmailChanges(false);
    }
  }, [billingEmailResult]);

  const updateNameMutation = useUpdateWorkspaceName(workspaceId, (originalName) =>
    setWorkspaceName(originalName)
  );
  const updateBillingEmailMutation = useUpdateWorkspaceBillingEmail({
    onSuccess: () => setHasBillingEmailChanges(false),
  });

  const handleSave = () => {
    if (workspaceName.trim() && workspaceName !== originalName) {
      updateNameMutation.mutate(workspaceName.trim());
    }
  };

  const handleSaveBillingEmail = () => {
    if (!workspaceId) return;
    updateBillingEmailMutation.mutate({
      workspaceId,
      email: billingEmail.trim(),
    });
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
                disabled={!canEdit || updateNameMutation.isPending}
              />
              {canEdit && hasChanges && (
                <Button onClick={handleSave} disabled={updateNameMutation.isPending} size="default">
                  {updateNameMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>

          {/* Billing Email Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="billing-email">Billing Email</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Invoices and billing related notifications will be sent to this email
              </p>
            </div>
            <div className="flex gap-2 items-start">
              <Input
                id="billing-email"
                type="email"
                value={billingEmail}
                onChange={(e) => {
                  setBillingEmail(e.target.value);
                  setHasBillingEmailChanges(
                    e.target.value !==
                      (billingEmailResult?.success
                        ? billingEmailResult.data.workspaceBillingEmail || ''
                        : '')
                  );
                }}
                placeholder="Enter billing email"
                className="max-w-md"
                disabled={!canEdit || updateBillingEmailMutation.isPending}
              />
              {canEdit && hasBillingEmailChanges && (
                <Button
                  onClick={handleSaveBillingEmail}
                  disabled={updateBillingEmailMutation.isPending}
                  size="default"
                >
                  {updateBillingEmailMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
