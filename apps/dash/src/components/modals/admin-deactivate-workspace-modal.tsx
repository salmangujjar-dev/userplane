'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@userplane/ui/components/select';
import { useState } from 'react';

import { ADMIN_NOTIFY_DURATION_OPTIONS } from '@/constants';
import type { AdminNotifyDuration } from '@/types';

interface Workspace {
  workspaceId: string;
  workspaceName: string;
}

interface AdminDeactivateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
  onConfirm: (notify?: AdminNotifyDuration) => void;
  isPending: boolean;
}

/**
 * Modal to confirm deactivating a workspace.
 * Requires admin to type workspace ID for confirmation.
 */
export function AdminDeactivateWorkspaceModal({
  open,
  onOpenChange,
  workspace,
  onConfirm,
  isPending,
}: AdminDeactivateWorkspaceModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [notify, setNotify] = useState<AdminNotifyDuration>('never');

  // Reset when the modal closes (adjust state during render)
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setConfirmationInput('');
      setNotify('never');
    }
  }

  if (!workspace) return null;

  const isConfirmed = confirmationInput === workspace.workspaceId;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm(notify);
    }
  };

  const consequences = [
    {
      title: 'Access Blocked',
      description: 'All members will be prevented from accessing this workspace',
    },
    {
      title: 'Projects Inaccessible',
      description: 'All projects in this workspace will become unavailable',
    },
    {
      title: 'Links Disabled',
      description: 'All recording links will stop accepting new recordings',
    },
    {
      title: 'Recordings Preserved',
      description: 'Existing recordings and data will be preserved but inaccessible',
    },
    {
      title: 'Can Be Restored',
      description: 'The workspace can be reactivated later to restore access',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Deactivate Workspace</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Deactivate <strong>{workspace.workspaceName}</strong>
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

          <div className="space-y-4">
            <div>
              <Label htmlFor="notify" className="mb-2 block">
                Notify workspace owners
              </Label>
              <Select
                value={notify}
                onValueChange={(value) => setNotify(value as AdminNotifyDuration)}
                disabled={isPending}
              >
                <SelectTrigger id="notify" className="rounded-lg">
                  <SelectValue placeholder="Select notification option" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_NOTIFY_DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="workspace-id-confirm" className="mb-2 block">
                Type <strong>{workspace.workspaceId}</strong> to confirm
              </Label>
              <Input
                id="workspace-id-confirm"
                type="text"
                placeholder="Enter workspace ID"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                disabled={isPending}
                className="font-mono"
                autoComplete="off"
              />
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
            <Button
              type="button"
              className="px-6"
              onClick={handleConfirm}
              disabled={!isConfirmed || isPending}
            >
              {isPending ? 'Deactivating...' : 'Deactivate Workspace'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
