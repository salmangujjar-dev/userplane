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
import { ShieldAlert } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminRevokeAllSessionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Modal to confirm revoking all sessions for a user.
 * Shows user details before revoking all their active sessions.
 */
export function AdminRevokeAllSessionsModal({
  open,
  onOpenChange,
  user,
  onConfirm,
  isPending,
}: AdminRevokeAllSessionsModalProps) {
  if (!user) return null;

  const displayName = user.name || 'this user';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Revoke All Sessions</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            Revoke all active sessions for <strong>{displayName}</strong> ({user.email}). The user
            will be logged out from all devices and will need to sign in again.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3">
          <Button type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Revoking...' : 'Revoke All Sessions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
