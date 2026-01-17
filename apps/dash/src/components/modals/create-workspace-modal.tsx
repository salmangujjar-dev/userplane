'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { WorkspaceNameSchema } from '@workspace/contract';

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWorkspace: (name: string) => void;
}

const createWorkspaceFormSchema = z.object({
  name: WorkspaceNameSchema,
});

export function CreateWorkspaceModal({
  open,
  onOpenChange,
  onCreateWorkspace,
}: CreateWorkspaceModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(createWorkspaceFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = (data: { name: string }) => {
    onCreateWorkspace(data.name);
    reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="workspace-name"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="e.g., My Workspace"
                    />
                  )}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
              <Button type="submit" className="rounded-full px-6" disabled={!isValid}>
                Create Workspace
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
