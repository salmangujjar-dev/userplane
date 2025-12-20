'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { Switch } from '@workspace/ui/components/switch';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (project: { title: string; isDefault: boolean }) => void;
  loading?: boolean;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onCreateProject,
  loading = false,
}: CreateProjectModalProps) {
  const [newProject, setNewProject] = useState({
    title: '',
    isDefault: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!open) {
      setNewProject({ title: '', isDefault: false });
      setShowAdvanced(false);
    }
  }, [open]);

  const handleCreate = () => {
    const isValid = newProject.title.trim();

    if (isValid) {
      onCreateProject(newProject);
    }
  };

  const handleCancel = () => {
    setNewProject({ title: '', isDefault: false });
    setShowAdvanced(false);
    onOpenChange(false);
  };

  const isFormValid = newProject.title.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Create New Project</DialogTitle>
              <div className="flex items-center gap-1.5">
                <DialogDescription className="text-sm text-muted-foreground">
                  Add a new project to organize your workspace recordings
                </DialogDescription>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href="https://userplane.com/docs/projects"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Learn more about projects</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-title" className="text-sm">
                Project Title
              </Label>
              <Input
                id="project-title"
                value={newProject.title}
                onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Production App"
                disabled={loading}
              />
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-default" className="text-sm font-medium">
                      Set as default
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Make this the default project for new recordings
                    </p>
                  </div>
                  <Switch
                    id="is-default"
                    checked={newProject.isDefault}
                    onCheckedChange={(checked) =>
                      setNewProject((prev) => ({ ...prev, isDefault: checked }))
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-8">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
          >
            {showAdvanced ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show more
              </>
            )}
          </button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleCreate}
              disabled={!isFormValid || loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
