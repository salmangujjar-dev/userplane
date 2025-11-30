'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Folder, Trash2, Cloud, MoreVertical, CheckCircle2 } from 'lucide-react';
import { CreateProjectModal } from '@/components/modals/create-project-modal';

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

const AVAILABLE_STORES: StoreOption[] = [
  { id: 1, title: 'Production Storage' },
  { id: 2, title: 'Development Storage' },
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
    name: string;
    title: string;
    path: string;
    location: ProjectLocation;
    storeId: number;
  }) => {
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
  };

  const handleDeleteProject = (projectId: number) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  };

  const getStoreName = (storeId?: number) => {
    const store = AVAILABLE_STORES.find((s) => s.id === storeId);
    return store?.title || 'No store';
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
                  <span className="text-sm font-medium">{project.name}</span>
                  {project.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>{getStoreName(project.storeId)}</span>
                  <span>•</span>
                  <span>{project.location}</span>
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
