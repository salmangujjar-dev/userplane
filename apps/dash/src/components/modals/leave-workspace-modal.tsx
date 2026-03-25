'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import { useEffect, useState } from 'react';

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

  const ownerConsequences = [
    {
      title: 'Workspace Deleted',
      description: `${workspaceName} will be permanently deleted`,
    },
    {
      title: 'All Data Lost',
      description: 'Recordings, links, domains, and projects will be permanently removed',
    },
    {
      title: 'Members Removed',
      description: 'All team members will lose access immediately',
    },
    {
      title: 'Cannot be Undone',
      description: 'This action is permanent and cannot be reversed',
    },
  ];

  const memberConsequences = [
    {
      title: 'Access Removed',
      description: 'You will lose access to all workspace content',
    },
    {
      title: 'Projects Inaccessible',
      description: 'You will no longer be able to view or manage projects',
    },
    {
      title: 'Re-invitation Required',
      description: 'You will need to be re-invited to rejoin this workspace',
    },
  ];

  const consequences = isOwner ? ownerConsequences : memberConsequences;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">
                {isOwner ? 'Delete Workspace' : 'Leave Workspace'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isOwner ? (
                  <>
                    Permanently delete <strong>{workspaceName}</strong>
                  </>
                ) : (
                  <>
                    Leave <strong>{workspaceName}</strong>
                  </>
                )}
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
            <Label htmlFor="confirm-name" className="mb-2 block">
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

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="px-6"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
            >
              {isLoading ? 'Processing...' : isOwner ? 'Delete Workspace' : 'Leave Workspace'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
