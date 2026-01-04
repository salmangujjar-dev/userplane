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
import { AlertTriangle, Loader2, MonitorSmartphone } from 'lucide-react';

interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
}

interface AdminRevokeSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: () => void;
  isPending: boolean;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
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
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            Revoke Session
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke this session? The user will be logged out immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-lg bg-muted p-4 overflow-hidden">
            <div className="flex items-start gap-3">
              <MonitorSmartphone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-sm font-medium">{session.ipAddress || 'Unknown IP'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expires {formatDateTime(session.expiresAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. The user will need to log in
              again to create a new session.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking...
              </>
            ) : (
              'Revoke Session'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
