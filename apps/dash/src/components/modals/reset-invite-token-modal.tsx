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
import { AlertTriangle } from 'lucide-react';

interface ResetInviteTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ResetInviteTokenModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ResetInviteTokenModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Reset Invite Token</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            This will generate a new invite token and invalidate the old one. Any existing invite
            links will no longer work and will need to be reshared with the new token.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Token'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
