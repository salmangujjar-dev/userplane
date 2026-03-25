'use client';

import { Button } from '@userplane/ui/components/button';
import { Link as LinkIcon, Plus, Rocket } from 'lucide-react';

interface AdminTopActionsProps {
  onCreateInviteClick?: () => void;
  onProvisionClick?: () => void;
  onCreatePlanClick?: () => void;
}

export function AdminTopActions({
  onCreateInviteClick,
  onProvisionClick,
  onCreatePlanClick,
}: AdminTopActionsProps) {
  const hasActions = onCreateInviteClick || onProvisionClick || onCreatePlanClick;

  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4">
      {hasActions && (
        <div className="flex items-center gap-2">
          {onProvisionClick && (
            <Button onClick={onProvisionClick} variant="secondary">
              Provision
              <Rocket className="h-4 w-4 ml-2" />
            </Button>
          )}
          {onCreateInviteClick && (
            <Button onClick={onCreateInviteClick}>
              Invite
              <LinkIcon className="h-4 w-4 ml-2" />
            </Button>
          )}
          {onCreatePlanClick && (
            <Button onClick={onCreatePlanClick}>
              Create Plan
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
