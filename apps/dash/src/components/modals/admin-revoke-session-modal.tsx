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
import { MonitorSmartphone } from 'lucide-react';

interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
}

interface AdminRevokeSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: () => void;
  isPending: boolean;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Modal to confirm revoking a user session.
 * Shows session details before revoking.
 */
export function AdminRevokeSessionModal({
  open,
  onOpenChange,
  session,
  onConfirm,
  isPending,
}: AdminRevokeSessionModalProps) {
  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Revoke Session</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                The user will be logged out immediately from this device
              </DialogDescription>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MonitorSmartphone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium">{session.ipAddress || 'Unknown IP'}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {formatDateTime(session.expiresAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The user will need to log
                  in again to create a new session.
                </p>
              </div>
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
              {isPending ? 'Revoking...' : 'Revoke Session'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
