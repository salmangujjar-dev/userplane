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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Folder, Cloud, ArrowLeftRight } from 'lucide-react';

type ProjectLocation = 'US' | 'EU' | 'Global' | 'Custom';

interface StoreOption {
  id: number;
  title: string;
}

const LOCATION_OPTIONS: ProjectLocation[] = ['US', 'EU', 'Global', 'Custom'];
const AVAILABLE_STORES: StoreOption[] = [
  { id: 1, title: 'Production Storage' },
  { id: 2, title: 'Development Storage' },
];

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (project: {
    name: string;
    title: string;
    path: string;
    location: ProjectLocation;
    storeId: number;
  }) => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onCreateProject,
}: CreateProjectModalProps) {
  const [newProject, setNewProject] = useState({
    name: '',
    title: '',
    path: '',
    location: 'US' as ProjectLocation,
    storeId: 1,
  });

  const handleCreate = () => {
    const isValid =
      newProject.name.trim() &&
      newProject.title.trim() &&
      (newProject.location !== 'Custom' || newProject.path.trim());

    if (isValid) {
      onCreateProject(newProject);
      setNewProject({ name: '', title: '', path: '', location: 'US', storeId: 1 });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setNewProject({ name: '', title: '', path: '', location: 'US', storeId: 1 });
    onOpenChange(false);
  };

  const isFormValid =
    newProject.name.trim() &&
    newProject.title.trim() &&
    (newProject.location !== 'Custom' || newProject.path.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
                <svg
                  viewBox="0 0 512 512"
                  className="h-8 w-8 flex-shrink-0"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M210.09,0c10.56,0,19.12,8.56,19.12,19.12v63.74c0,10.56-8.56,19.12-19.12,19.12s-19.12-8.56-19.12-19.12V19.12C190.97,8.56,199.53,0,210.09,0z M88.22,50.22c7.47-7.47,19.57-7.47,27.04,0l44.62,44.61c7.47,7.47,7.47,19.57,0,27.04c-7.47,7.47-19.57,7.47-27.04,0L88.22,77.26C80.75,69.8,80.75,57.69,88.22,50.22z M331.97,50.22c7.47,7.47,7.47,19.57,0,27.04l-44.62,44.62c-7.47,7.47-19.57,7.47-27.04,0c-7.47-7.47-7.47-19.57,0-27.04l44.62-44.62C312.39,42.75,324.5,42.75,331.97,50.22z M38,172.09c0-10.56,8.56-19.12,19.12-19.12h63.74c10.56,0,19.12,8.56,19.12,19.12c0,10.56-8.56,19.12-19.12,19.12H57.12C46.56,191.21,38,182.65,38,172.09z M190.97,190.88c0-28.73,33.7-44.23,55.51-25.53l215.71,184.9c23.2,19.89,9.99,57.91-20.54,59.13l-97.9,3.92c-10.52,0.42-20.42,5.09-27.44,12.93l-66.66,74.5c-20.58,23-58.69,8.44-58.69-22.42V190.88z" />
                </svg>
              </div>
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-xl font-semibold">Create New Project</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add a new project to organize your workspace recordings
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-sm">
                Project Name
              </Label>
              <Input
                id="project-name"
                value={newProject.name}
                onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Project"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-title" className="text-sm">
                Project Title
              </Label>
              <Input
                id="project-title"
                value={newProject.title}
                onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Production App"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Project Location</Label>
              <div className="grid grid-cols-4 gap-2">
                {LOCATION_OPTIONS.map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => setNewProject((prev) => ({ ...prev, location }))}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      newProject.location === location
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-input'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>

            {newProject.location === 'Custom' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="project-store" className="text-sm">
                    Store
                  </Label>
                  <Select
                    value={newProject.storeId.toString()}
                    onValueChange={(value) =>
                      setNewProject((prev) => ({ ...prev, storeId: parseInt(value) }))
                    }
                  >
                    <SelectTrigger id="project-store">
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_STORES.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Cloud className="h-4 w-4" />
                            {store.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-path" className="text-sm">
                    Project Path
                  </Label>
                  <Input
                    id="project-path"
                    value={newProject.path}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, path: e.target.value }))}
                    placeholder="e.g., /var/www/production"
                  />
                </div>
              </>
            )}
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
              Create Project
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
