'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Folder, Trash2, MoreVertical, CheckCircle2 } from 'lucide-react';
import { CreateProjectModal } from '@/components/modals/create-project-modal';

interface Project {
  id: number;
  title: string;
  storeId: number;
  isDefault: boolean;
}

interface StoreOption {
  id: number;
  title: string;
  region: string;
  expiry: string;
}

const PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Production App',
    storeId: 1,
    isDefault: true,
  },
  {
    id: 2,
    title: 'Dev Environment',
    storeId: 2,
    isDefault: false,
  },
  {
    id: 3,
    title: 'Staging Server',
    storeId: 3,
    isDefault: false,
  },
];

const AVAILABLE_STORES: StoreOption[] = [
  { id: 1, title: 'Production Storage', region: 'US East', expiry: '30 days' },
  { id: 2, title: 'Development Storage', region: 'EU West', expiry: '7 days' },
  { id: 3, title: 'Global Storage', region: 'Global', expiry: '90 days' },
  { id: 4, title: 'Staging Storage', region: 'US West', expiry: '14 days' },
];

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [showModal, setShowModal] = useState(false);

  const handleSetDefault = (projectId: number) => {
    setProjects((prev) =>
      prev.map((project) => ({
        ...project,
        isDefault: project.id === projectId,
      }))
    );
  };

  const handleCreateProject = (newProject: {
    title: string;
    storeId: number;
    isDefault: boolean;
  }) => {
    const project: Project = {
      id: Math.max(...projects.map((p) => p.id), 0) + 1,
      title: newProject.title,
      storeId: newProject.storeId,
      isDefault: newProject.isDefault,
    };
    setProjects((prev) =>
      prev
        .map((p) => ({ ...p, isDefault: newProject.isDefault ? false : p.isDefault }))
        .concat(project)
    );
  };

  const handleDeleteProject = (projectId: number) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  };

  const getStoreDetails = (storeId: number) => {
    const store = AVAILABLE_STORES.find((s) => s.id === storeId);
    return store || { title: 'No store', region: '', expiry: '' };
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <p className="text-sm text-muted-foreground">Manage workspace projects</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <Folder className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{project.title}</span>
                  {project.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>{getStoreDetails(project.storeId).title}</span>
                  <span>•</span>
                  <span>{getStoreDetails(project.storeId).region}</span>
                  <span>•</span>
                  <span>Expiry: {getStoreDetails(project.storeId).expiry}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSetDefault(project.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Set as default
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteProject(project.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        <Button variant="outline" className="w-full max-w-2xl" onClick={() => setShowModal(true)}>
          Add New Project
        </Button>
      </div>

      <CreateProjectModal
        open={showModal}
        onOpenChange={setShowModal}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
