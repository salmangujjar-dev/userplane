'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { KeyRound } from 'lucide-react';

interface Workspace {
  workspaceId: string;
  workspaceName: string;
}

interface ResetInviteTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * Modal to confirm resetting workspace invite token.
 * Shows workspace details before generating a new token.
 */
export function ResetInviteTokenModal({
  open,
  onOpenChange,
  workspace,
  onConfirm,
  isPending = false,
}: ResetInviteTokenModalProps) {
  if (!workspace) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Reset Invite Token</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            Generate a new invite token for <strong>{workspace.workspaceName}</strong> and
            invalidate the old one. Any existing invite links will no longer work and will need to
            be reshared with the new token.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3">
          <Button type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Resetting...' : 'Reset Token'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
