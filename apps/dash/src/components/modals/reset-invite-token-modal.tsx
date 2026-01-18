'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';

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

  const consequences = [
    {
      title: 'New Token Generated',
      description: 'A new invite token will be created for this workspace',
    },
    {
      title: 'Old Token Invalidated',
      description: 'The previous invite token will no longer work',
    },
    {
      title: 'Links Need Resharing',
      description: 'Existing invite links must be reshared with the new token',
    },
    {
      title: 'Security Enhancement',
      description: 'Use this when the current invite link may have been compromised',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Reset Invite Token</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Generate a new invite token for <strong>{workspace.workspaceName}</strong>
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
              disabled={isPending}
            >
              {isPending ? 'Resetting...' : 'Reset Token'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
