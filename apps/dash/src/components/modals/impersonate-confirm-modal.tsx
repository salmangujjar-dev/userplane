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
import { UserCog } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ImpersonateConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Modal to confirm impersonating a user.
 * Shows user details before starting impersonation.
 */
export function ImpersonateConfirmModal({
  open,
  onOpenChange,
  user,
  onConfirm,
  isPending,
}: ImpersonateConfirmModalProps) {
  if (!user) return null;

  const displayName = user.name || 'this user';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <UserCog className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Impersonate User</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            Impersonate <strong>{displayName}</strong> ({user.email}). This will create a new
            session as this user. All actions will be performed as them, and a banner will remind
            you that you are impersonating.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3">
          <Button type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Impersonating...' : 'Start Impersonating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
