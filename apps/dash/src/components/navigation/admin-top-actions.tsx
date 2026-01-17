'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus, Link as LinkIcon } from 'lucide-react';

interface AdminTopActionsProps {
  onCreateInviteClick?: () => void;
  onProvisionWorkspaceClick?: () => void;
}

export function AdminTopActions({
  onCreateInviteClick,
  onProvisionWorkspaceClick,
}: AdminTopActionsProps) {
  const hasActions = onCreateInviteClick || onProvisionWorkspaceClick;

  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4">
      {hasActions && (
        <div className="flex items-center gap-2">
          {onProvisionWorkspaceClick && (
            <Button onClick={onProvisionWorkspaceClick} variant="outline" className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Provision
            </Button>
          )}
          {onCreateInviteClick && (
            <Button onClick={onCreateInviteClick} className="rounded-full">
              <LinkIcon className="h-4 w-4 mr-2" />
              Invite
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
