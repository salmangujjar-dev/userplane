'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { useEffect, useState } from 'react';

interface Workspace {
  workspaceId: string;
  workspaceName: string;
}

interface AdminDeactivateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Modal to confirm deactivating a workspace.
 * Requires admin to type workspace ID for confirmation.
 */
export function AdminDeactivateWorkspaceModal({
  open,
  onOpenChange,
  workspace,
  onConfirm,
  isPending,
}: AdminDeactivateWorkspaceModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmationInput('');
    }
  }, [open]);

  if (!workspace) return null;

  const isConfirmed = confirmationInput === workspace.workspaceId;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  const consequences = [
    {
      title: 'Access Blocked',
      description: 'All members will be prevented from accessing this workspace',
    },
    {
      title: 'Projects Inaccessible',
      description: 'All projects in this workspace will become unavailable',
    },
    {
      title: 'Links Disabled',
      description: 'All recording links will stop accepting new recordings',
    },
    {
      title: 'Recordings Preserved',
      description: 'Existing recordings and data will be preserved but inaccessible',
    },
    {
      title: 'Can Be Restored',
      description: 'The workspace can be reactivated later to restore access',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Deactivate Workspace</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Deactivate <strong>{workspace.workspaceName}</strong>
              </DialogDescription>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="space-y-2.5">
              {consequences.map((consequence) => (
                <div key={consequence.title} className="flex gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{consequence.title}</p>
                    <p className="text-xs text-muted-foreground">{consequence.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="workspace-id-confirm" className="mb-2 block">
              Type <strong>{workspace.workspaceId}</strong> to confirm
            </Label>
            <Input
              id="workspace-id-confirm"
              type="text"
              placeholder="Enter workspace ID"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              disabled={isPending}
              className="font-mono"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleConfirm}
              disabled={!isConfirmed || isPending}
            >
              {isPending ? 'Deactivating...' : 'Deactivate Workspace'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
