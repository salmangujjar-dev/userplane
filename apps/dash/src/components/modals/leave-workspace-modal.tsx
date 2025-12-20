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
import { AlertTriangle } from 'lucide-react';

interface LeaveWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  isOwner: boolean;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LeaveWorkspaceModal({
  open,
  onOpenChange,
  workspaceName,
  isOwner,
  onConfirm,
  isLoading = false,
}: LeaveWorkspaceModalProps) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (confirmText === workspaceName) {
      onConfirm();
    }
  };

  const isConfirmDisabled = confirmText !== workspaceName || isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>{isOwner ? 'Delete Workspace' : 'Leave Workspace'}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            {isOwner ? (
              <>
                This action cannot be undone. This will permanently delete the workspace and all
                associated data, including recordings, links, and settings.
              </>
            ) : (
              <>
                You will lose access to all workspace content and will need to be re-invited to
                rejoin.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div>
            <Label htmlFor="confirm-name" className="mb-3 block">
              Type <strong>{workspaceName}</strong> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={workspaceName}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading ? 'Processing...' : isOwner ? 'Delete Workspace' : 'Leave Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
