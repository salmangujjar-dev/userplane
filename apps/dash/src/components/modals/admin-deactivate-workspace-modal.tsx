'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Building2 } from 'lucide-react';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Deactivate Workspace</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            Deactivate <strong>{workspace.workspaceName}</strong>. This will prevent all members
            from accessing projects, links, domains, and recordings in this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
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

        <DialogFooter className="gap-3">
          <Button type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleConfirm}
            disabled={!isConfirmed || isPending}
          >
            {isPending ? 'Deactivating...' : 'Deactivate Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
