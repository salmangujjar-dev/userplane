'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Building2 } from 'lucide-react';

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWorkspace: (name: string) => void;
}

export function CreateWorkspaceModal({
  open,
  onOpenChange,
  onCreateWorkspace,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onCreateWorkspace(name);
      setName('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setName('');
    onOpenChange(false);
  };

  const isFormValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-xl font-semibold">Create New Workspace</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Create a new workspace to organize your projects and team
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name" className="text-sm">
                Workspace Name
              </Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Workspace"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isFormValid) {
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleCreate}
              disabled={!isFormValid}
            >
              Create Workspace
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
