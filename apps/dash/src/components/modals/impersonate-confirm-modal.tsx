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
 * Shows user details and consequences before starting impersonation.
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

  const consequences = [
    {
      title: 'New Session Created',
      description: `You will be logged in as ${displayName}`,
    },
    {
      title: 'All Actions as User',
      description: 'Every action will be performed as this user',
    },
    {
      title: 'Impersonation Banner',
      description: 'A banner will remind you that you are impersonating',
    },
    {
      title: 'Admin Responsibility',
      description: 'Use this feature responsibly and only for legitimate support purposes',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Impersonate User</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Impersonate <strong>{displayName}</strong> (<strong>{user.email}</strong>)
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
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? 'Impersonating...' : 'Start Impersonating'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
