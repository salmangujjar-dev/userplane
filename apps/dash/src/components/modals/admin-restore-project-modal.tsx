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

interface Project {
  projectId: string;
  projectTitle: string;
}

interface AdminRestoreProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onConfirm: (notify?: AdminNotifyDuration) => void;
  isPending: boolean;
}

/**
 * Modal to confirm restoring a project.
 * Requires admin to type project ID for confirmation.
 */
export function AdminRestoreProjectModal({
  open,
  onOpenChange,
  project,
  onConfirm,
  isPending,
}: AdminRestoreProjectModalProps) {
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

  if (!project) return null;

  const isConfirmed = confirmationInput === project.projectId;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm(notify);
    }
  };

  const projectName = project.projectTitle || 'Untitled Project';

  const consequences = [
    {
      title: 'Project Restored',
      description: 'This project will be reactivated and visible in the workspace',
    },
    {
      title: 'Links Reactivated',
      description: 'All associated links will resume accepting new recordings',
    },
    {
      title: 'Data Preserved',
      description: 'All existing recordings and data will remain intact',
    },
    {
      title: 'Full Functionality',
      description: 'The project will function normally after restoration',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Reactivate Project</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Reactivate <strong>{projectName}</strong>
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
              <Label htmlFor="project-id-confirm" className="mb-2 block">
                Type <strong>{project.projectId}</strong> to confirm
              </Label>
              <Input
                id="project-id-confirm"
                type="text"
                placeholder="Enter project ID"
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
              {isPending ? 'Reactivating...' : 'Reactivate Project'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
