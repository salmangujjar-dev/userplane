'use client';

import { Button } from '@workspace/ui/components/button';
import { Link as LinkIcon, Plus } from 'lucide-react';

interface AdminTopActionsProps {
  onCreateInviteClick?: () => void;
}

export function AdminTopActions({ onCreateInviteClick }: AdminTopActionsProps) {
  const hasActions = onCreateInviteClick;

  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4">
      {hasActions && (
        <div className="flex items-center gap-2">
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
