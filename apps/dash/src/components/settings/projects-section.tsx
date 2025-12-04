'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Folder, Trash2, MoreVertical, CheckCircle2, ChevronRight, Pencil } from 'lucide-react';
import { CreateProjectModal } from '@/components/modals/create-project-modal';
import { EditProjectModal } from '@/components/modals/edit-project-modal';

interface Project {
  id: number;
  title: string;
  isDefault: boolean;
}

const PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Production App',
    isDefault: true,
  },
  {
    id: 2,
    title: 'Dev Environment',
    isDefault: false,
  },
  {
    id: 3,
    title: 'Staging Server',
    isDefault: false,
  },
];

export function ProjectsSection() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleSetDefault = (projectId: number) => {
    setProjects((prev) =>
      prev.map((project) => ({
        ...project,
        isDefault: project.id === projectId,
      }))
    );
  };

  const handleCreateProject = (newProject: { title: string; isDefault: boolean }) => {
    const project: Project = {
      id: Math.max(...projects.map((p) => p.id), 0) + 1,
      title: newProject.title,
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

  const handleViewProject = (projectId: number) => {
    if (workspaceId) {
      router.push(`/${workspaceId}/projects/${projectId}`);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleSaveEdit = (
    projectId: number,
    updatedProject: { title: string; isDefault: boolean }
  ) => {
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        id: p.id === projectId ? projectId : p.id,
        title: p.id === projectId ? updatedProject.title : p.title,
        isDefault: updatedProject.isDefault
          ? p.id === projectId
          : p.isDefault && p.id !== projectId,
      }))
    );
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{project.title}</span>
                {project.isDefault && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Default
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
                onClick={() => handleViewProject(project.id)}
              >
                View
                <ChevronRight className="h-4 w-4" />
              </Button>
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
                  <DropdownMenuItem onClick={() => handleEditProject(project)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit project
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

      <EditProjectModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        project={editingProject}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
