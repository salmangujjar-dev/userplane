'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import Logo from '@userplane/ui/components/logo';

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

  const consequences = [
    {
      title: 'All Sessions Revoked',
      description: 'User will be logged out from all devices immediately',
    },
    {
      title: 'Sign In Required',
      description: 'User will need to sign in again to access their account',
    },
    {
      title: 'Security Action',
      description: 'Use this to enforce logout across all active sessions',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Revoke All Sessions</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Revoke all active sessions for <strong>{displayName}</strong> (
                <strong>{user.email}</strong>)
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
              className="px-6"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" className="px-6" onClick={onConfirm} disabled={isPending}>
              {isPending ? 'Revoking...' : 'Revoke All Sessions'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
