'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Folder, ChevronDown, X, Trash2, Cloud } from 'lucide-react';

type ProjectLocation = 'US' | 'EU' | 'Global' | 'Custom';

interface Project {
  id: number;
  name: string;
  title: string;
  path: string;
  location: ProjectLocation;
  storeId?: number;
  isDefault: boolean;
}

interface StoreOption {
  id: number;
  title: string;
}

const PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Main Project',
    title: 'Production App',
    path: '/var/www/production',
    location: 'US',
    storeId: 1,
    isDefault: true,
  },
  {
    id: 2,
    name: 'Development',
    title: 'Dev Environment',
    path: '/var/www/development',
    location: 'EU',
    storeId: 2,
    isDefault: false,
  },
  {
    id: 3,
    name: 'Staging',
    title: 'Staging Server',
    path: '/var/www/staging',
    location: 'Global',
    storeId: 1,
    isDefault: false,
  },
];

const LOCATION_OPTIONS: ProjectLocation[] = ['US', 'EU', 'Global', 'Custom'];
const AVAILABLE_STORES: StoreOption[] = [
  { id: 1, title: 'Production Storage' },
  { id: 2, title: 'Development Storage' },
];

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    title: '',
    path: '',
    location: 'US' as ProjectLocation,
    storeId: 1,
  });

  const handleToggleProject = (projectId: number) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const handleUpdateProject = (
    projectId: number,
    field: keyof Project,
    value: string | boolean | ProjectLocation | number
  ) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, [field]: value }
          : field === 'isDefault' && value === true
            ? { ...project, isDefault: false }
            : project
      )
    );
  };

  const handleAddProject = () => {
    const isValid =
      newProject.name.trim() &&
      newProject.title.trim() &&
      (newProject.location !== 'Custom' || newProject.path.trim());

    if (isValid) {
      const project: Project = {
        id: Math.max(...projects.map((p) => p.id), 0) + 1,
        name: newProject.name,
        title: newProject.title,
        path: newProject.path,
        location: newProject.location,
        storeId: newProject.storeId,
        isDefault: false,
      };
      setProjects((prev) => [...prev, project]);
      setNewProject({ name: '', title: '', path: '', location: 'US', storeId: 1 });
      setShowAddProject(false);
    }
  };

  const handleCancelAdd = () => {
    setNewProject({ name: '', title: '', path: '', location: 'US', storeId: 1 });
    setShowAddProject(false);
  };

  const handleDeleteProject = (projectId: number) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    if (expandedProject === projectId) {
      setExpandedProject(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <p className="text-sm text-muted-foreground">Manage workspace projects</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {projects.map((project) => (
          <Collapsible
            key={project.id}
            open={expandedProject === project.id}
            onOpenChange={() => handleToggleProject(project.id)}
          >
            <div className="rounded-xl border bg-card">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{project.name}</span>
                  {project.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Default
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    expandedProject === project.id ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${project.id}`} className="text-sm">
                      Project Title
                    </Label>
                    <Input
                      id={`title-${project.id}`}
                      value={project.title}
                      onChange={(e) => handleUpdateProject(project.id, 'title', e.target.value)}
                      placeholder="Enter project title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Project Location</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {LOCATION_OPTIONS.map((location) => (
                        <button
                          key={location}
                          type="button"
                          onClick={() => handleUpdateProject(project.id, 'location', location)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            project.location === location
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted border-input'
                          }`}
                        >
                          {location}
                        </button>
                      ))}
                    </div>
                  </div>

                  {project.location === 'Custom' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`store-${project.id}`} className="text-sm">
                          Store
                        </Label>
                        <Select
                          value={project.storeId?.toString() || '1'}
                          onValueChange={(value) =>
                            handleUpdateProject(project.id, 'storeId', parseInt(value))
                          }
                        >
                          <SelectTrigger id={`store-${project.id}`}>
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
                        <Label htmlFor={`path-${project.id}`} className="text-sm">
                          Project Path
                        </Label>
                        <Input
                          id={`path-${project.id}`}
                          value={project.path}
                          onChange={(e) => handleUpdateProject(project.id, 'path', e.target.value)}
                          placeholder="Enter project path"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor={`default-${project.id}`} className="text-sm">
                      Default Project
                    </Label>
                    <div className="flex items-center gap-3">
                      <Switch
                        id={`default-${project.id}`}
                        checked={project.isDefault}
                        onCheckedChange={(checked) =>
                          handleUpdateProject(project.id, 'isDefault', checked)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        {showAddProject ? (
          <div className="p-4 rounded-xl border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Add New Project</h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCancelAdd}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-project-name" className="text-sm">
                Project Name
              </Label>
              <Input
                id="new-project-name"
                value={newProject.name}
                onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Project"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-project-title" className="text-sm">
                Project Title
              </Label>
              <Input
                id="new-project-title"
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
                  <Label htmlFor="new-project-store" className="text-sm">
                    Store
                  </Label>
                  <Select
                    value={newProject.storeId.toString()}
                    onValueChange={(value) =>
                      setNewProject((prev) => ({ ...prev, storeId: parseInt(value) }))
                    }
                  >
                    <SelectTrigger id="new-project-store">
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
                  <Label htmlFor="new-project-path" className="text-sm">
                    Project Path
                  </Label>
                  <Input
                    id="new-project-path"
                    value={newProject.path}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, path: e.target.value }))}
                    placeholder="e.g., /var/www/production"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleAddProject}
                disabled={
                  !newProject.name.trim() ||
                  !newProject.title.trim() ||
                  (newProject.location === 'Custom' && !newProject.path.trim())
                }
              >
                Add Project
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelAdd}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full max-w-2xl"
            onClick={() => setShowAddProject(true)}
          >
            Add New Project
          </Button>
        )}
      </div>
    </div>
  );
}
