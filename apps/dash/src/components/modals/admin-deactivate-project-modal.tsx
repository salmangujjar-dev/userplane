'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';

interface Project {
  projectId: string;
  projectTitle: string | null;
}

interface AdminDeactivateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Modal to confirm deactivating a project.
 * Requires admin to type project ID for confirmation.
 */
export function AdminDeactivateProjectModal({
  open,
  onOpenChange,
  project,
  onConfirm,
  isPending,
}: AdminDeactivateProjectModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmationInput('');
    }
  }, [open]);

  if (!project) return null;

  const isConfirmed = confirmationInput === project.projectId;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  const projectName = project.projectTitle || 'Untitled Project';

  const consequences = [
    {
      title: 'Project Deactivated',
      description: 'This project will be soft-deleted and hidden from the workspace',
    },
    {
      title: 'Links Affected',
      description: 'All links associated with this project will be deactivated',
    },
    {
      title: 'Recordings Preserved',
      description: 'Existing recordings will be preserved but inaccessible',
    },
    {
      title: 'Can Be Restored',
      description: 'The project can be reactivated later to restore access',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Deactivate Project</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Deactivate <strong>{projectName}</strong>
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
              onClick={handleConfirm}
              disabled={!isConfirmed || isPending}
            >
              {isPending ? 'Deactivating...' : 'Deactivate Project'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
