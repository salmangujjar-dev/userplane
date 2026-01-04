'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useSession } from '@/hooks/use-session';
import { useAuth } from '@/hooks/use-auth';

/**
 * A banner displayed at the top of the page when an admin is impersonating another user.
 * Shows the impersonated user's info and provides a button to stop impersonating.
 */
export function ImpersonationBanner() {
  const { user, isImpersonating, isPending } = useSession();
  const { stopImpersonating } = useAuth();

  // Don't render anything if not impersonating or still loading
  if (isPending || !isImpersonating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            You are impersonating <strong>{user?.name || user?.email || 'a user'}</strong>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopImpersonating}
          className="h-7 gap-1.5 text-amber-950 hover:bg-amber-600 hover:text-amber-950"
        >
          <X className="h-3.5 w-3.5" />
          Stop Impersonating
        </Button>
      </div>
    </div>
  );
}
